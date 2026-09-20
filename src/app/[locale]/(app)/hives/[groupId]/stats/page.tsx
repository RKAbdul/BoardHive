import type { CSSProperties } from "react"
import { getTranslations } from "next-intl/server"
import { getHiveStats } from "@/features/stats/data"
import { Link } from "@/i18n/navigation"
import { TOKEN_CLASSES } from "@/lib/token-color"

export default async function HiveStatsPage({
  params,
}: PageProps<"/[locale]/hives/[groupId]/stats">) {
  const { groupId } = await params
  const t = await getTranslations("stats")
  const { totalPlays, mostPlayed, standings } = await getHiveStats(groupId)

  if (totalPlays === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-muted-foreground">{t("totalPlays", { count: totalPlays })}</p>

      <div>
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
          {t("standings")}
        </h2>
        <ol className="relative mt-4 flex flex-col gap-4 pl-4">
          <span
            className="absolute top-2 bottom-2 left-[7px] w-px bg-border"
            aria-hidden="true"
          />
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
                {t("wins", { count: s.wins })}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
          {t("mostPlayed")}
        </h2>
        <ul className="mt-4 flex flex-col gap-2">
          {mostPlayed.map((g) => (
            <li key={g.bggId}>
              <Link
                href={`/hives/${groupId}/games/${g.bggId}`}
                className="flex items-center gap-3 rounded-md py-1 transition-colors hover:text-primary"
              >
                <span className="min-w-0 flex-1 truncate text-foreground">{g.name}</span>
                <span className="shrink-0 font-display text-sm font-bold tabular-nums text-muted-foreground">
                  {g.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
