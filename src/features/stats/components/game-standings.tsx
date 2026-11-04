"use client"

import { useState, type CSSProperties } from "react"
import { useFormatter, useTranslations } from "next-intl"
import { tokenClassFor } from "@/lib/token-color"
import type { PlayerGameStats } from "@/features/stats/game-stats"
import { ChevronDown } from "lucide-react"

export type StandingsMetric = "wins" | "winRate" | "avgPosition" | "avgScore" | "podiums"

/**
 * The game's standings as a track, re-sortable by whichever measure of
 * "doing well" the group cares about right now. Tapping a player opens
 * their full line for this game.
 */
export function GameStandings({
  standings,
  metrics,
  lowerScoreWins,
  showFactions,
}: {
  standings: PlayerGameStats[]
  metrics: StandingsMetric[]
  lowerScoreWins: boolean
  showFactions: boolean
}) {
  const t = useTranslations("gameStats")
  const format = useFormatter()
  const [metric, setMetric] = useState<StandingsMetric>(metrics[0] ?? "wins")

  const decimal = (n: number) => format.number(n, { maximumFractionDigits: 1 })
  const percent = (n: number) => format.number(n, { style: "percent", maximumFractionDigits: 0 })

  function metricValue(s: PlayerGameStats, m: StandingsMetric): number | null {
    switch (m) {
      case "wins":
        return s.wins
      case "winRate":
        return s.winRate
      case "avgPosition":
        return s.avgPosition
      case "avgScore":
        return s.avgScore
      case "podiums":
        return s.podiums
    }
  }

  function formatMetric(m: StandingsMetric, value: number | null) {
    if (value === null) return "—"
    if (m === "winRate") return percent(value)
    if (m === "avgPosition" || m === "avgScore") return decimal(value)
    return format.number(value)
  }

  // Lower is better for position, and for score in golf-style games.
  const ascending = metric === "avgPosition" || (metric === "avgScore" && lowerScoreWins)

  const sorted = [...standings].sort((a, b) => {
    const va = metricValue(a, metric)
    const vb = metricValue(b, metric)
    // Players with nothing to rank on sink to the bottom either way.
    if (va === null && vb === null) return b.wins - a.wins
    if (va === null) return 1
    if (vb === null) return -1
    if (va !== vb) return ascending ? va - vb : vb - va
    return b.wins - a.wins || b.plays - a.plays
  })

  return (
    <div>
      {metrics.length > 1 && (
        <div
          role="radiogroup"
          aria-label={t("rankBy")}
          className="mt-3 flex flex-wrap gap-1.5"
        >
          {metrics.map((m) => {
            const active = m === metric
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMetric(m)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-accent"
                }`}
              >
                {t(`metric.${m}`)}
              </button>
            )
          })}
        </div>
      )}
      {metric === "avgPosition" && (
        <p className="mt-2 text-xs text-muted-foreground">{t("positionNote")}</p>
      )}

      <ol className="relative mt-4 flex flex-col gap-2 pl-4">
        <span className="absolute top-3 bottom-3 left-[7px] w-px bg-border" aria-hidden="true" />
        {sorted.map((s, i) => (
          <li
            key={s.key}
            className="track-enter relative"
            style={{ "--track-i": i } as CSSProperties}
          >
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg py-1.5 pr-1 transition-colors hover:bg-accent/50 [&::-webkit-details-marker]:hidden">
                <span
                  className={`z-10 size-3.5 shrink-0 rounded-full ring-4 ring-background ${tokenClassFor(s.key)}`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">{s.name}</span>
                <span className="shrink-0 font-display text-sm font-bold tabular-nums text-foreground">
                  {formatMetric(metric, metricValue(s, metric))}
                </span>
                <ChevronDown
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </summary>

              <dl className="mt-1 mb-2 ml-6.5 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm sm:grid-cols-3">
                <Stat label={t("player.plays")} value={format.number(s.plays)} />
                <Stat label={t("metric.wins")} value={format.number(s.wins)} />
                <Stat label={t("metric.winRate")} value={percent(s.winRate)} />
                <Stat label={t("metric.avgPosition")} value={formatMetric("avgPosition", s.avgPosition)} />
                <Stat label={t("metric.avgScore")} value={formatMetric("avgScore", s.avgScore)} />
                <Stat
                  label={t("player.bestScore")}
                  value={s.bestScore === null ? "—" : format.number(s.bestScore)}
                />
                <Stat label={t("player.longestStreak")} value={format.number(s.longestWinStreak)} />
                {metrics.includes("podiums") && (
                  <Stat label={t("metric.podiums")} value={format.number(s.podiums)} />
                )}
                {showFactions && (
                  <Stat
                    label={t("player.topFaction")}
                    value={
                      s.topFaction
                        ? t("player.topFactionValue", {
                            name: s.topFaction.name,
                            count: s.topFaction.plays,
                          })
                        : "—"
                    }
                    wide
                  />
                )}
              </dl>
            </details>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Stat({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 sm:col-span-3" : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-display font-bold tabular-nums text-foreground break-words">{value}</dd>
    </div>
  )
}
