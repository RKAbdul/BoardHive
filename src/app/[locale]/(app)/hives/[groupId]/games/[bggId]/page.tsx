import type { CSSProperties } from "react"
import { notFound } from "next/navigation"
import Image from "next/image"
import { getFormatter, getTranslations } from "next-intl/server"
import { getGameDetail } from "@/features/games/data"
import { getGameStatsForHive } from "@/features/stats/data"
import { getRecentPlaysForGameInHive } from "@/features/plays/data"
import { Link } from "@/i18n/navigation"
import { TOKEN_CLASSES } from "@/lib/token-color"
import { Dices, Medal, Shuffle, Trophy } from "lucide-react"

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
  const [game, { totalPlays, modeCounts, standings, factionStandings }, recentPlays] =
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
                        {format.dateTime(new Date(play.played_at), { month: "short", day: "numeric" })}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {modeCounts.racing > 0 && (
            <div>
              <h2 className="flex items-center gap-1.5 font-display text-lg font-bold tracking-tight text-foreground">
                <Trophy className="size-4 text-token-2" aria-hidden="true" />
                {t("racingStandings")}
              </h2>
              <ol className="relative mt-4 flex flex-col gap-4 pl-4">
                <span className="absolute top-2 bottom-2 left-[7px] w-px bg-border" aria-hidden="true" />
                {standings
                  .filter((s) => s.podiums > 0 || s.wins > 0)
                  .sort((a, b) => b.podiums - a.podiums || b.wins - a.wins)
                  .map((s, i) => (
                    <li
                      key={s.name + i}
                      className="track-enter relative flex items-center gap-3"
                      style={{ "--track-i": i } as CSSProperties}
                    >
                      <span
                        className={`z-10 size-3.5 shrink-0 rounded-full ring-4 ring-background ${TOKEN_CLASSES[i % TOKEN_CLASSES.length]}`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate font-medium text-foreground">{s.name}</span>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <Medal className="size-3.5" aria-hidden="true" />
                        {t("podiums", { count: s.podiums })}
                      </span>
                      <span className="shrink-0 font-display text-sm font-bold tabular-nums text-foreground">
                        {s.wins}
                      </span>
                    </li>
                  ))}
              </ol>
            </div>
          )}

          {modeCounts.asymmetric > 0 && (
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
                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">{f.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {t("plays", { count: f.plays })}
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
              {t("standings")}
            </h2>
            <ol className="relative mt-4 flex flex-col gap-4 pl-4">
              <span className="absolute top-2 bottom-2 left-[7px] w-px bg-border" aria-hidden="true" />
              {standings.map((s, i) => (
                <li
                  key={s.name + i}
                  className="track-enter relative flex items-center gap-3"
                  style={{ "--track-i": i } as CSSProperties}
                >
                  <span
                    className={`z-10 size-3.5 shrink-0 rounded-full ring-4 ring-background ${TOKEN_CLASSES[i % TOKEN_CLASSES.length]}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">{s.name}</span>
                  <span className="shrink-0 font-display text-sm font-bold tabular-nums text-foreground">
                    {s.wins}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  )
}
