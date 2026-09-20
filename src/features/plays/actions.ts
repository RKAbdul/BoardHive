"use server"

import { revalidatePath } from "next/cache"
import { getLocale, getTranslations } from "next-intl/server"
import { redirect } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireSession } from "@/lib/dal"
import { searchGames as searchGamesQuery, getFactionsForGame } from "./data"
import { createPlaySchema, type ActionState, type PhotoErrorCode } from "./schemas"

export async function searchGamesAction(query: string) {
  return searchGamesQuery(query)
}

export async function getFactionsForGameAction(groupId: string, bggId: number) {
  return getFactionsForGame(groupId, bggId)
}

export async function createPlay(
  groupId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession()
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "common" })

  const raw = formData.get("payload")
  if (typeof raw !== "string") {
    return { error: t("somethingWentWrong") }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { error: t("somethingWentWrong") }
  }

  const validated = createPlaySchema.safeParse(parsed)
  if (!validated.success) {
    return { error: t("somethingWentWrong") }
  }

  const { gameId, mode, playedAt, notes, participants } = validated.data
  const supabase = await createClient()

  // Resolve any newly-typed faction names to faction rows before inserting
  // participants. Upserting on the (group_id, game_id, name) unique
  // constraint both creates a faction the first time anyone in this hive
  // names it for this game, and dedupes when two participants in the same
  // submission typed the same new name.
  const resolvedParticipants: (typeof participants[number] & {
    resolvedFactionId: string | null
  })[] = []

  for (const p of participants) {
    let resolvedFactionId = p.factionId
    if (!resolvedFactionId && p.newFactionName) {
      const { data: faction, error: factionError } = await supabase
        .from("factions")
        .upsert(
          { group_id: groupId, game_id: gameId, name: p.newFactionName, created_by: session.userId },
          { onConflict: "group_id,game_id,name" }
        )
        .select("id")
        .single()

      if (factionError || !faction) {
        return { error: factionError?.message ?? t("somethingWentWrong") }
      }
      resolvedFactionId = faction.id
    }
    resolvedParticipants.push({ ...p, resolvedFactionId })
  }

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
      resolvedParticipants.map((p) => ({
        play_id: play.id,
        user_id: p.userId,
        guest_name: p.guestName,
        // In racing mode, "winner" is derived from finishing first rather
        // than toggled by hand — a separate manual winner flag alongside a
        // podium position invites the two to disagree.
        is_winner: mode === "racing" ? p.placement === 1 : p.isWinner,
        score: p.score,
        placement: p.placement,
        faction_id: p.resolvedFactionId,
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

export async function deletePlay(groupId: string, playId: string) {
  await requireSession()
  const locale = await getLocale()
  const supabase = await createClient()
  await supabase.from("plays").delete().eq("id", playId)
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
