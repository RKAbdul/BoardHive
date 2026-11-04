"use client"

import { useEffect, useState, useTransition, type FormEvent } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { LinkButton } from "@/components/ui/link-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { GamePicker } from "@/features/plays/components/game-picker"
import { ModeSelector } from "@/features/plays/components/mode-selector"
import { ParticipantRow, type Participant } from "@/features/plays/components/participant-row"
import { PhotoPicker } from "@/features/plays/components/photo-picker"
import {
  createPlay,
  updatePlay,
  confirmPhotoUpload,
  getFactionsForGameAction,
} from "@/features/plays/actions"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "@/i18n/navigation"
import type { PlayMode } from "@/features/plays/schemas"
import { Dices } from "lucide-react"

type Game = { bgg_id: number; name: string; image_url: string | null }
type Member = { user_id: string; display_name: string }

export type PlayFormInitial = {
  game: Game | null
  mode: PlayMode
  playedAt: string
  notes: string
  participants: Participant[]
}

/**
 * The one form behind both logging a new play and editing an existing one.
 * With `playId` it edits that play in place (photos are managed separately,
 * on the play's own page); without it, it logs a new play and uploads any
 * staged photos once the play exists.
 */
export function PlayForm({
  groupId,
  members,
  libraryGames,
  playId,
  initial,
}: {
  groupId: string
  members: Member[]
  libraryGames: Game[]
  playId?: string
  initial?: PlayFormInitial
}) {
  const t = useTranslations("plays.new")
  const tEdit = useTranslations("plays.edit")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!playId

  const [game, setGame] = useState<Game | null>(initial?.game ?? null)
  const [mode, setMode] = useState<PlayMode>(initial?.mode ?? "generic")
  const [participants, setParticipants] = useState<Participant[]>(initial?.participants ?? [])
  const [guestDraft, setGuestDraft] = useState("")
  const [playedAt, setPlayedAt] = useState(
    () => initial?.playedAt ?? new Date().toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState(initial?.notes ?? "")
  const [photos, setPhotos] = useState<File[]>([])
  const [factions, setFactions] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (!game || mode !== "asymmetric") return
    let cancelled = false
    getFactionsForGameAction(groupId, game.bgg_id).then((result) => {
      if (!cancelled) setFactions(result)
    })
    return () => {
      cancelled = true
    }
  }, [game, mode, groupId])

  function changeGame(next: Game | null) {
    // Factions belong to one game — a pick made for the old game would
    // point at a faction that doesn't exist for the new one.
    if (next?.bgg_id !== game?.bgg_id) {
      setFactions([])
      setParticipants((prev) =>
        prev.map((p) => ({ ...p, factionId: null, newFactionName: null }))
      )
    }
    setGame(next)
  }

  function toggleMember(member: Member) {
    setParticipants((prev) => {
      const exists = prev.some((p) => p.userId === member.user_id)
      if (exists) return prev.filter((p) => p.userId !== member.user_id)
      return [
        ...prev,
        {
          key: `user:${member.user_id}`,
          id: null,
          userId: member.user_id,
          guestName: null,
          displayName: member.display_name,
          isWinner: false,
          score: "",
          placement: "",
          factionId: null,
          newFactionName: null,
        },
      ]
    })
  }

  function addGuest() {
    const name = guestDraft.trim()
    if (!name) return
    setParticipants((prev) => [
      ...prev,
      {
        key: `guest:${Date.now()}`,
        id: null,
        userId: null,
        guestName: name,
        displayName: name,
        isWinner: false,
        score: "",
        placement: "",
        factionId: null,
        newFactionName: null,
      },
    ])
    setGuestDraft("")
  }

  function removeParticipant(key: string) {
    setParticipants((prev) => prev.filter((p) => p.key !== key))
  }

  function updateParticipant(key: string, patch: Partial<Participant>) {
    setParticipants((prev) =>
      prev.map((p) => (p.key === key ? { ...p, ...patch } : p))
    )
  }

  const canSubmit = !!game && participants.length > 0 && !pending

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!game) return

    const payload = {
      gameId: game.bgg_id,
      mode,
      playedAt,
      notes: notes.trim() || null,
      participants: participants.map((p) => ({
        id: p.id,
        userId: p.userId,
        guestName: p.guestName,
        isWinner: p.isWinner,
        score: p.score.trim() === "" ? null : Number(p.score),
        placement: p.placement.trim() === "" ? null : Number(p.placement),
        factionId: p.factionId,
        newFactionName: p.newFactionName?.trim() || null,
      })),
    }

    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set("payload", JSON.stringify(payload))
      const result = playId
        ? await updatePlay(groupId, playId, null, formData)
        : await createPlay(groupId, null, formData)

      if (result?.error) {
        setError(result.error)
        return
      }
      if (!result?.playId || !result.groupId) return

      // Staged photos go straight from the browser to storage — a server
      // action's request body can't carry them (see createPlay) — so this
      // uploads them here, after the play already exists, before
      // navigating. Best-effort: the data that actually matters (the play
      // itself) is already saved either way.
      if (!isEditing && photos.length > 0) {
        const supabase = createClient()
        for (const file of photos) {
          const path = `${result.groupId}/${result.playId}/${crypto.randomUUID()}`
          const { error: uploadError } = await supabase.storage
            .from("play-photos")
            .upload(path, file, { contentType: file.type })
          if (!uploadError) {
            await confirmPhotoUpload(result.groupId, result.playId, path)
          }
        }
      }

      if (isEditing) {
        // replace, not push: Back from the play page should go wherever the
        // person came from, not into the form they just submitted.
        router.replace(`/hives/${result.groupId}/plays/${result.playId}`)
      } else {
        router.push(`/hives/${result.groupId}/plays/${result.playId}`)
      }
    })
  }

  // Members who have since left the hive can still be on an old play —
  // they keep their participant row but can't be re-toggled as a chip.
  const memberIds = new Set(members.map((m) => m.user_id))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <Label className="mb-2">{t("gameLabel")}</Label>
        {game ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
              {game.image_url ? (
                <Image src={game.image_url} alt="" fill sizes="48px" className="object-cover" />
              ) : (
                <Dices className="size-5 text-muted-foreground" aria-hidden="true" />
              )}
            </span>
            <span className="min-w-0 flex-1 truncate font-display text-base font-bold text-foreground">
              {game.name}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={() => changeGame(null)}>
              {t("changeGame")}
            </Button>
          </div>
        ) : (
          <GamePicker libraryGames={libraryGames} onSelect={changeGame} />
        )}
      </div>

      <div>
        <Label className="mb-2">{t("mode.label")}</Label>
        <ModeSelector value={mode} onChange={setMode} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="playedAt">{t("dateLabel")}</Label>
        <Input
          id="playedAt"
          type="date"
          value={playedAt}
          onChange={(e) => setPlayedAt(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
        />
      </div>

      <div>
        <Label className="mb-2">{t("participantsLabel")}</Label>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const active = participants.some((p) => p.userId === m.user_id)
            return (
              <button
                key={m.user_id}
                type="button"
                onClick={() => toggleMember(m)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-accent"
                }`}
              >
                {m.display_name}
              </button>
            )
          })}
        </div>

        <div className="mt-2 flex gap-2">
          <Input
            type="text"
            placeholder={t("guestNamePlaceholder")}
            value={guestDraft}
            onChange={(e) => setGuestDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addGuest()
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addGuest}>
            {t("addGuest")}
          </Button>
        </div>

        {participants.length > 0 && (
          <ul className="mt-4 flex flex-col gap-3">
            {participants.map((p) => (
              <ParticipantRow
                key={p.key}
                participant={p}
                mode={mode}
                factions={factions}
                onChange={(patch) => updateParticipant(p.key, patch)}
                onRemove={() => removeParticipant(p.key)}
              />
            ))}
          </ul>
        )}
        {participants.some((p) => p.userId && !memberIds.has(p.userId)) && (
          <p className="mt-2 text-xs text-muted-foreground">{tEdit("formerMemberNote")}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">{t("notesLabel")}</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      {!isEditing && (
        <div>
          <Label className="mb-2">{t("photos.label")}</Label>
          <PhotoPicker onFilesChange={setPhotos} />
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {!game && <p className="text-sm text-muted-foreground">{t("selectGamePrompt")}</p>}
      {game && participants.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("atLeastOneParticipant")}</p>
      )}

      <div className="flex flex-col gap-2">
        <Button type="submit" size="lg" disabled={!canSubmit}>
          {isEditing
            ? pending
              ? tEdit("submitting")
              : tEdit("submit")
            : pending
              ? t("submitting")
              : t("submit")}
        </Button>
        {isEditing && (
          <LinkButton href={`/hives/${groupId}/plays/${playId}`} variant="ghost" size="lg">
            {tCommon("cancel")}
          </LinkButton>
        )}
      </div>
    </form>
  )
}
