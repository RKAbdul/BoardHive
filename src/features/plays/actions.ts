"use server"

import { revalidatePath } from "next/cache"
import { getLocale, getTranslations } from "next-intl/server"
import { redirect } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireSession } from "@/lib/dal"
import { getMyRole } from "@/features/hives/data"
import { searchGames as searchGamesQuery, getFactionsForGame } from "./data"
import { canManagePlay } from "./permissions"
import {
  createPlaySchema,
  type ActionState,
  type CreatePlayInput,
  type PhotoErrorCode,
} from "./schemas"

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export async function searchGamesAction(query: string) {
  return searchGamesQuery(query)
}

export async function getFactionsForGameAction(groupId: string, bggId: number) {
  return getFactionsForGame(groupId, bggId)
}

function parsePlayPayload(formData: FormData): CreatePlayInput | null {
  const raw = formData.get("payload")
  if (typeof raw !== "string") return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  const validated = createPlaySchema.safeParse(parsed)
  return validated.success ? validated.data : null
}

// Resolve any newly-typed faction names to faction rows before writing
// participants. Upserting on the (group_id, game_id, name) unique
// constraint both creates a faction the first time anyone in this hive
// names it for this game, and dedupes when two participants in the same
// submission typed the same new name.
async function resolveFactionIds(
  supabase: SupabaseServerClient,
  groupId: string,
  userId: string,
  { gameId, mode, participants }: CreatePlayInput
): Promise<{ factionIds: (string | null)[] } | { error: string | null }> {
  const factionIds: (string | null)[] = []

  for (const p of participants) {
    // Outside asymmetric mode the faction picker isn't shown, so anything
    // left over from switching modes mid-form is stale, not a choice.
    if (mode !== "asymmetric") {
      factionIds.push(null)
      continue
    }

    let resolvedFactionId = p.factionId
    if (!resolvedFactionId && p.newFactionName) {
      const { data: faction, error: factionError } = await supabase
        .from("factions")
        .upsert(
          { group_id: groupId, game_id: gameId, name: p.newFactionName, created_by: userId },
          { onConflict: "group_id,game_id,name" }
        )
        .select("id")
        .single()

      if (factionError || !faction) {
        return { error: factionError?.message ?? null }
      }
      resolvedFactionId = faction.id
    }
    factionIds.push(resolvedFactionId)
  }

  return { factionIds }
}

function toParticipantRow(
  p: CreatePlayInput["participants"][number],
  mode: CreatePlayInput["mode"],
  factionId: string | null
) {
  return {
    user_id: p.userId,
    guest_name: p.guestName,
    // In racing mode, "winner" is derived from finishing first rather
    // than toggled by hand — a separate manual winner flag alongside a
    // podium position invites the two to disagree.
    is_winner: mode === "racing" ? p.placement === 1 : p.isWinner,
    score: p.score,
    placement: p.placement,
    faction_id: factionId,
  }
}

/**
 * Loads the bits of a play needed to authorize a change to it, plus whether
 * the caller may make one (see canManagePlay). A play from another hive is
 * treated exactly like a missing one.
 */
async function authorizePlayChange(
  supabase: SupabaseServerClient,
  groupId: string,
  playId: string,
  userId: string
) {
  const [{ data: play }, role] = await Promise.all([
    supabase.from("plays").select("id, group_id, game_id, logged_by").eq("id", playId).maybeSingle(),
    getMyRole(groupId, userId),
  ])

  if (!play || play.group_id !== groupId) return null
  return { play, allowed: canManagePlay(play, userId, role) }
}

export async function createPlay(
  groupId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession()
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "common" })

  const input = parsePlayPayload(formData)
  if (!input) return { error: t("somethingWentWrong") }

  const { gameId, mode, playedAt, notes, participants } = input
  const supabase = await createClient()

  const factions = await resolveFactionIds(supabase, groupId, session.userId, input)
  if ("error" in factions) return { error: factions.error ?? t("somethingWentWrong") }

  const { data: play, error: playError } = await supabase
    .from("plays")
    .insert({
      group_id: groupId,
      game_id: gameId,
      mode,
      played_at: playedAt,
      notes,
      logged_by: session.userId,
    })
    .select("id")
    .single()

  if (playError || !play) {
    return { error: playError?.message ?? t("somethingWentWrong") }
  }

  const { error: participantsError } = await supabase
    .from("play_participants")
    .insert(
      participants.map((p, i) => ({
        play_id: play.id,
        ...toParticipantRow(p, mode, factions.factionIds[i]),
      }))
    )

  if (participantsError) {
    // Best-effort cleanup so a failed submission doesn't leave an
    // empty/orphaned play behind.
    await supabase.from("plays").delete().eq("id", play.id)
    return { error: participantsError.message }
  }

  revalidatePath(`/hives/${groupId}`)
  revalidatePath(`/hives/${groupId}/plays`)

  // No redirect here: any staged photos still need to go from the client
  // straight to storage (a server action's request body can't carry them —
  // see confirmPhotoUpload below), so the client navigates itself once
  // those uploads finish.
  return { playId: play.id, groupId }
}

export async function updatePlay(
  groupId: string,
  playId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession()
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "common" })
  const tEdit = await getTranslations({ locale, namespace: "plays.edit" })

  const input = parsePlayPayload(formData)
  if (!input) return { error: t("somethingWentWrong") }

  const supabase = await createClient()
  const auth = await authorizePlayChange(supabase, groupId, playId, session.userId)
  if (!auth) return { error: t("somethingWentWrong") }
  if (!auth.allowed) return { error: tEdit("forbidden") }

  const { gameId, mode, playedAt, notes, participants } = input

  const factions = await resolveFactionIds(supabase, groupId, session.userId, input)
  if ("error" in factions) return { error: factions.error ?? t("somethingWentWrong") }

  const { error: playError } = await supabase
    .from("plays")
    .update({ game_id: gameId, mode, played_at: playedAt, notes })
    .eq("id", playId)
  if (playError) return { error: playError.message }

  // Diff against what's stored rather than delete-all-then-reinsert: there's
  // no transaction across these calls, and this order (add, then change,
  // then remove) means a failure partway through can at worst leave an
  // extra row behind — it can never wipe out the participants already there.
  const { data: existing, error: existingError } = await supabase
    .from("play_participants")
    .select("id")
    .eq("play_id", playId)
  if (existingError) return { error: existingError.message }

  const existingIds = new Set(existing.map((row) => row.id))
  const rows = participants.map((p, i) => ({
    id: p.id && existingIds.has(p.id) ? p.id : null,
    row: toParticipantRow(p, mode, factions.factionIds[i]),
  }))

  const toInsert = rows.filter((r) => r.id === null)
  if (toInsert.length > 0) {
    const { error } = await supabase
      .from("play_participants")
      .insert(toInsert.map((r) => ({ play_id: playId, ...r.row })))
    if (error) return { error: error.message }
  }

  const toUpdate = rows.filter((r): r is { id: string; row: (typeof r)["row"] } => r.id !== null)
  const updateResults = await Promise.all(
    toUpdate.map((r) => supabase.from("play_participants").update(r.row).eq("id", r.id))
  )
  const updateError = updateResults.find((r) => r.error)?.error
  if (updateError) return { error: updateError.message }

  const keptIds = new Set(toUpdate.map((r) => r.id))
  const toDelete = [...existingIds].filter((id) => !keptIds.has(id))
  if (toDelete.length > 0) {
    const { error } = await supabase.from("play_participants").delete().in("id", toDelete)
    if (error) return { error: error.message }
  }

  revalidatePath(`/hives/${groupId}`)
  revalidatePath(`/hives/${groupId}/plays`)
  revalidatePath(`/hives/${groupId}/plays/${playId}`)
  revalidatePath(`/hives/${groupId}/games/${auth.play.game_id}`)
  if (auth.play.game_id !== gameId) revalidatePath(`/hives/${groupId}/games/${gameId}`)

  return { playId, groupId }
}

export async function deletePlay(groupId: string, playId: string) {
  const session = await requireSession()
  const locale = await getLocale()
  const supabase = await createClient()

  // Previously only the UI hid this button from non-loggers; the action
  // itself would delete any play in the hive for any member who called it.
  const auth = await authorizePlayChange(supabase, groupId, playId, session.userId)
  if (auth?.allowed) {
    await supabase.from("plays").delete().eq("id", playId)
  }

  revalidatePath(`/hives/${groupId}`)
  revalidatePath(`/hives/${groupId}/plays`)
  redirect({ href: `/hives/${groupId}/plays`, locale })
}

export async function upsertComment(groupId: string, playId: string, body: string) {
  const session = await requireSession()
  if (!body.trim()) return
  const supabase = await createClient()
  await supabase
    .from("comments")
    .upsert(
      { play_id: playId, user_id: session.userId, body: body.trim(), updated_at: new Date().toISOString() },
      { onConflict: "play_id,user_id" }
    )
  revalidatePath(`/hives/${groupId}/plays/${playId}`)
}

export async function deleteComment(groupId: string, playId: string, commentId: string) {
  await requireSession()
  const supabase = await createClient()
  await supabase.from("comments").delete().eq("id", commentId)
  revalidatePath(`/hives/${groupId}/plays/${playId}`)
}

// The file itself is uploaded client-side, straight to Supabase Storage —
// see the comment on createPlay for why. This only records the resulting
// path once that upload has already succeeded, so it's a tiny payload with
// no platform body-size concern.
export async function confirmPhotoUpload(
  groupId: string,
  playId: string,
  storagePath: string
): Promise<{ error: PhotoErrorCode | null }> {
  const session = await requireSession()

  // Defense in depth — storage RLS already scopes the upload itself to a
  // group the caller belongs to, but the path is still client-supplied, so
  // it shouldn't be trusted blindly for the DB write either.
  if (!storagePath.startsWith(`${groupId}/${playId}/`)) {
    return { error: "generic" }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("photos")
    .insert({ play_id: playId, storage_path: storagePath, uploaded_by: session.userId })
  if (error) return { error: "generic" }

  revalidatePath(`/hives/${groupId}/plays/${playId}`)
  return { error: null }
}

export async function deletePlayPhoto(
  groupId: string,
  playId: string,
  photoId: string,
  storagePath: string
) {
  await requireSession()
  const supabase = await createClient()
  await supabase.from("photos").delete().eq("id", photoId)
  await supabase.storage.from("play-photos").remove([storagePath])
  revalidatePath(`/hives/${groupId}/plays/${playId}`)
}
