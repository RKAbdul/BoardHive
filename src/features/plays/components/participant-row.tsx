"use client"

import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { FactionPicker } from "@/features/plays/components/faction-picker"
import type { PlayMode } from "@/features/plays/schemas"
import { Star, X } from "lucide-react"

export type Participant = {
  key: string
  userId: string | null
  guestName: string | null
  displayName: string
  isWinner: boolean
  score: string
  placement: string
  factionId: string | null
  newFactionName: string | null
}

export function ParticipantRow({
  participant,
  mode,
  factions,
  onChange,
  onRemove,
}: {
  participant: Participant
  mode: PlayMode
  factions: { id: string; name: string }[]
  onChange: (patch: Partial<Participant>) => void
  onRemove: () => void
}) {
  const t = useTranslations("plays.new")

  return (
    <li className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <span className="flex-1 truncate font-medium text-foreground">
          {participant.displayName}
        </span>

        {mode === "racing" && (
          <label className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{t("position")}</span>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={participant.placement}
              onChange={(e) => onChange({ placement: e.target.value })}
              className="w-16 text-center"
              aria-label={t("position")}
            />
          </label>
        )}

        {mode !== "racing" && (
          <button
            type="button"
            aria-pressed={participant.isWinner}
            aria-label={t("winner")}
            onClick={() => onChange({ isWinner: !participant.isWinner })}
            className={`rounded-md p-1.5 transition-colors ${
              participant.isWinner
                ? "text-token-2"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Star className={`size-5 ${participant.isWinner ? "fill-current" : ""}`} />
          </button>
        )}

        <button
          type="button"
          aria-label={t("removeParticipant")}
          onClick={onRemove}
          className="rounded-md p-1.5 text-muted-foreground hover:text-destructive"
        >
          <X className="size-4" />
        </button>
      </div>

      {mode === "asymmetric" && (
        <div className="mt-2">
          <FactionPicker
            factions={factions}
            value={{ factionId: participant.factionId, newFactionName: participant.newFactionName }}
            onChange={({ factionId, newFactionName }) => onChange({ factionId, newFactionName })}
          />
        </div>
      )}

      <details className="mt-2">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
          {mode === "racing" ? t("score") : `${t("score")} · ${t("placement")}`}
        </summary>
        <div className={`mt-2 grid gap-2 ${mode === "racing" ? "grid-cols-1" : "grid-cols-2"}`}>
          <Input
            type="number"
            inputMode="numeric"
            placeholder={t("score")}
            value={participant.score}
            onChange={(e) => onChange({ score: e.target.value })}
          />
          {mode !== "racing" && (
            <Input
              type="number"
              inputMode="numeric"
              placeholder={t("placement")}
              value={participant.placement}
              onChange={(e) => onChange({ placement: e.target.value })}
            />
          )}
        </div>
      </details>
    </li>
  )
}
