"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { GamePicker } from "@/features/plays/components/game-picker"
import { ModeSelector } from "@/features/plays/components/mode-selector"
import { ParticipantRow, type Participant } from "@/features/plays/components/participant-row"
import { PhotoPicker } from "@/features/plays/components/photo-picker"
import { createPlay, getFactionsForGameAction } from "@/features/plays/actions"
import type { ActionState, PlayMode } from "@/features/plays/schemas"
import { Dices } from "lucide-react"

type Game = { bgg_id: number; name: string; image_url: string | null }
type Member = { user_id: string; display_name: string }

export function NewPlayForm({
  groupId,
  members,
  libraryGames,
}: {
  groupId: string
  members: Member[]
  libraryGames: Game[]
}) {
  const t = useTranslations("plays.new")
  const boundCreatePlay = useMemo(
    () => createPlay.bind(null, groupId),
    [groupId]
  )
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    boundCreatePlay,
    null
  )

  const [game, setGame] = useState<Game | null>(null)
  const [mode, setMode] = useState<PlayMode>("generic")
  const [participants, setParticipants] = useState<Participant[]>([])
  const [guestDraft, setGuestDraft] = useState("")
  const [playedAt, setPlayedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState("")
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

  function toggleMember(member: Member) {
    setParticipants((prev) => {
      const exists = prev.some((p) => p.userId === member.user_id)
      if (exists) return prev.filter((p) => p.userId !== member.user_id)
      return [
        ...prev,
        {
          key: `user:${member.user_id}`,
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

  const payload = game
    ? JSON.stringify({
        gameId: game.bgg_id,
        mode,
        playedAt,
        notes: notes.trim() || null,
        participants: participants.map((p) => ({
          userId: p.userId,
          guestName: p.guestName,
          isWinner: p.isWinner,
          score: p.score.trim() === "" ? null : Number(p.score),
          placement: p.placement.trim() === "" ? null : Number(p.placement),
          factionId: p.factionId,
          newFactionName: p.newFactionName?.trim() || null,
        })),
      })
    : ""

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="payload" value={payload} readOnly />

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
            <Button type="button" variant="ghost" size="sm" onClick={() => setGame(null)}>
              {t("changeGame")}
            </Button>
          </div>
        ) : (
          <GamePicker libraryGames={libraryGames} onSelect={setGame} />
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
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">{t("notesLabel")}</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      <div>
        <Label className="mb-2">{t("photos.label")}</Label>
        <PhotoPicker />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      {!game && <p className="text-sm text-muted-foreground">{t("selectGamePrompt")}</p>}
      {game && participants.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("atLeastOneParticipant")}</p>
      )}

      <Button type="submit" size="lg" disabled={!canSubmit}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  )
}
