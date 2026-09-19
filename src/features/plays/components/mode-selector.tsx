"use client"

import { useTranslations } from "next-intl"
import { PLAY_MODES, type PlayMode } from "@/features/plays/schemas"
import { Flag, Shuffle, Dices } from "lucide-react"

const MODE_ICONS: Record<PlayMode, typeof Dices> = {
  generic: Dices,
  racing: Flag,
  asymmetric: Shuffle,
}

export function ModeSelector({
  value,
  onChange,
}: {
  value: PlayMode
  onChange: (mode: PlayMode) => void
}) {
  const t = useTranslations("plays.new.mode")

  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t("label")}>
      {PLAY_MODES.map((mode) => {
        const Icon = MODE_ICONS[mode]
        const active = value === mode
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(mode)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-colors ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-accent"
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {t(mode)}
          </button>
        )
      })}
    </div>
  )
}
