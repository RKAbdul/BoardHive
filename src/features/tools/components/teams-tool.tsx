"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { shuffle } from "@/features/tools/lib/shuffle"
import type { ToolParticipant } from "@/features/tools/types"
import { Minus, Plus } from "lucide-react"

const TOKEN_CLASSES = ["bg-token-1", "bg-token-2", "bg-token-3", "bg-token-4", "bg-token-5", "bg-token-6"]

export function TeamsTool({ participants }: { participants: ToolParticipant[] }) {
  const t = useTranslations("tools.teams")
  const [teamCount, setTeamCount] = useState(2)
  const [teams, setTeams] = useState<ToolParticipant[][] | null>(null)

  const maxTeams = Math.max(2, Math.min(participants.length, 6))

  function makeTeams() {
    const count = Math.max(1, Math.min(teamCount, participants.length))
    const shuffled = shuffle(participants)
    const buckets: ToolParticipant[][] = Array.from({ length: count }, () => [])
    shuffled.forEach((p, i) => {
      buckets[i % count].push(p)
    })
    setTeams(buckets)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label className="mb-2">{t("teamCount")}</Label>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setTeamCount((n) => Math.max(2, n - 1))}
            disabled={teamCount <= 2}
            aria-label={t("decrease")}
          >
            <Minus className="size-4" aria-hidden="true" />
          </Button>
          <span className="w-6 text-center font-display text-lg font-bold tabular-nums text-foreground">
            {teamCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setTeamCount((n) => Math.min(maxTeams, n + 1))}
            disabled={teamCount >= maxTeams}
            aria-label={t("increase")}
          >
            <Plus className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <Button type="button" size="lg" onClick={makeTeams} disabled={participants.length === 0}>
        {teams ? t("shuffleAgain") : t("shuffle")}
      </Button>

      {teams && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {teams.map((team, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`size-2.5 shrink-0 rounded-full ${TOKEN_CLASSES[i % TOKEN_CLASSES.length]}`}
                  aria-hidden="true"
                />
                <span className="text-sm font-bold text-foreground">
                  {t("team", { number: i + 1 })}
                </span>
              </div>
              <ul className="flex flex-col gap-1">
                {team.map((p) => (
                  <li key={p.key} className="truncate text-sm text-foreground">
                    {p.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
