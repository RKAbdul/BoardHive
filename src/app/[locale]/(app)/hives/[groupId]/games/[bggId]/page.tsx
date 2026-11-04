import { notFound } from "next/navigation"
import Image from "next/image"
import { getFormatter, getTranslations } from "next-intl/server"
import { getGameDetail } from "@/features/games/data"
import { getGameStatsForHive } from "@/features/stats/data"
import { getRecentPlaysForGameInHive } from "@/features/plays/data"
import { GameStandings, type StandingsMetric } from "@/features/stats/components/game-standings"
import { Link } from "@/i18n/navigation"
import { Dices, Shuffle } from "lucide-react"

export default async function HiveGameStatsPage({
  params,
}: PageProps<"/[locale]/hives/[groupId]/games/[bggId]">) {
  const { groupId, bggId } = await params
  const id = Number(bggId)
  if (!Number.isFinite(id)) notFound()

  // getGameStatsForHive/getRecentPlaysForGameInHive only need groupId/id,
  // not game itself — they were previously stuck waiting on getGameDetail
  // for no reason, adding a fully avoidable sequential round-trip to a page
  // reached from both the library and Stats standings.
  const [game, { totalPlays, modeCounts, standings, factionStandings, records }, recentPlays] =
    await Promise.all([
      getGameDetail(id),
      getGameStatsForHive(groupId, id),
      getRecentPlaysForGameInHive(groupId, id, 3),
    ])
  if (!game) notFound()

  const format = await getFormatter()
  const t = await getTranslations("gameStats")
  const tGames = await getTranslations("games")
  const tPlays = await getTranslations("plays")

  const decimal = (n: number) => format.number(n, { maximumFractionDigits: 1 })
  const shortDate = (d: string) => format.dateTime(new Date(d), { month: "short", day: "numeric" })

  // Only offer a ranking someone actually has data for — no "Avg. score"
  // switch on a game nobody has ever scored.
  const metrics: StandingsMetric[] = ["wins", "winRate"]
  if (standings.some((s) => s.avgPosition !== null)) metrics.push("avgPosition")
  if (standings.some((s) => s.avgScore !== null)) metrics.push("avgScore")
  if (modeCounts.racing > 0) metrics.push("podiums")

  const recordRows: { label: string; value: string; detail?: string; playId?: string }[] = []
  if (records.bestScore) {
    recordRows.push({
      label: records.lowerScoreWins ? t("records.lowScore") : t("records.highScore"),
      value: format.number(records.bestScore.score),
      detail: t("records.byOn", {
        name: records.bestScore.name,
        date: shortDate(records.bestScore.playedAt),
      }),
      playId: records.bestScore.playId,
    })
  }
  if (records.avgWinningScore !== null) {
    recordRows.push({ label: t("records.avgWinningScore"), value: decimal(records.avgWinningScore) })
  }
  if (records.closestWin) {
    recordRows.push({
      label: t("records.closestWin"),
      value: t("records.margin", { count: records.closestWin.margin }),
      detail: t("records.byOn", {
        name: records.closestWin.name,
        date: shortDate(records.closestWin.playedAt),
      }),
      playId: records.closestWin.playId,
    })
  }
  recordRows.push({ label: t("records.avgTableSize"), value: decimal(records.avgTableSize) })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-4">
        {game.image_url ? (
          <span className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
            <Image src={game.image_url} alt="" fill sizes="80px" className="object-cover" />
          </span>
        ) : (
          <span className="flex aspect-square w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
            <Dices className="size-6 text-muted-foreground" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl leading-[1.05] font-bold tracking-tight text-foreground break-words">
            {game.name}
          </h1>
          {game.min_players && game.max_players && (
            <p className="mt-1 text-sm text-muted-foreground">
              {tGames("players", { min: game.min_players, max: game.max_players })}
            </p>
          )}
          <Link
            href={`/games/${id}`}
            className="mt-1.5 inline-block text-sm font-medium text-primary hover:underline"
          >
            {t("viewGameInfo")}
          </Link>
        </div>
      </div>

      {totalPlays === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t("totalPlays", { count: totalPlays })}</p>

          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
              {t("standings")}
            </h2>
            <GameStandings
              standings={standings}
              metrics={metrics}
              lowerScoreWins={records.lowerScoreWins}
              showFactions={modeCounts.asymmetric > 0}
            />
          </div>

          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
              {t("records.title")}
            </h2>
            <ul className="mt-3 flex flex-col divide-y divide-border">
              {recordRows.map((r) => {
                const body = (
                  <>
                    <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                      {r.label}
                      {r.detail && (
                        <span className="block truncate text-xs text-muted-foreground/80">
                          {r.detail}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 font-display text-sm font-bold tabular-nums text-foreground">
                      {r.value}
                    </span>
                  </>
                )
                return (
                  <li key={r.label}>
                    {r.playId ? (
                      <Link
                        href={`/hives/${groupId}/plays/${r.playId}`}
                        className="flex items-center gap-3 py-2.5 transition-colors hover:bg-accent/50"
                      >
                        {body}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 py-2.5">{body}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          {modeCounts.asymmetric > 0 && factionStandings.length > 0 && (
            <div>
              <h2 className="flex items-center gap-1.5 font-display text-lg font-bold tracking-tight text-foreground">
                <Shuffle className="size-4 text-token-1" aria-hidden="true" />
                {t("factionStandings")}
              </h2>
              <ul className="mt-4 flex flex-col gap-2">
                {factionStandings.map((f) => (
                  <li
                    key={f.name}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">{f.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {t("plays", { count: f.plays })}
                        {f.avgScore !== null && ` · ${t("avgScoreShort", { score: decimal(f.avgScore) })}`}
                      </span>
                    </span>
                    <span className="shrink-0 font-display text-sm font-bold tabular-nums text-foreground">
                      {format.number(f.winRate, { style: "percent", maximumFractionDigits: 0 })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
              {t("recentPlays")}
            </h2>
            <ul className="mt-4 flex flex-col gap-2">
              {recentPlays.map((play) => {
                const winners = play.participants.filter((p) => p.is_winner)
                const summary =
                  winners.length > 0
                    ? winners.map((w) => w.profile?.display_name ?? w.guest_name ?? "?").join(", ")
                    : tPlays("playerCount", { count: play.participants.length })
                return (
                  <li key={play.id}>
                    <Link
                      href={`/hives/${groupId}/plays/${play.id}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:bg-accent"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {winners.length > 0 ? tPlays("won", { name: summary }) : summary}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {shortDate(play.played_at)}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
