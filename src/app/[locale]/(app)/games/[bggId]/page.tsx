import { notFound } from "next/navigation"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { getGameDetail } from "@/features/games/data"

export default async function GameDetailPage({
  params,
}: PageProps<"/[locale]/games/[bggId]">) {
  const { bggId } = await params
  const id = Number(bggId)
  if (!Number.isFinite(id)) notFound()

  const game = await getGameDetail(id)
  if (!game) notFound()

  const t = await getTranslations("games")
  const categories = game.categories.map((c) => c.category?.name).filter(Boolean)
  const mechanics = game.mechanics.map((m) => m.mechanic?.name).filter(Boolean)

  return (
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8">
      <div className="flex gap-4">
        {game.image_url && (
          <span className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
            <Image src={game.image_url} alt="" fill sizes="112px" className="object-cover" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl leading-[1.05] font-bold tracking-tight text-foreground break-words">
            {game.name}
          </h1>
          {game.year_published && (
            <p className="mt-1 text-sm text-muted-foreground">{game.year_published}</p>
          )}
          <div className="mt-2 flex flex-col gap-0.5 text-sm text-muted-foreground">
            {game.min_players && game.max_players && (
              <span>{t("players", { min: game.min_players, max: game.max_players })}</span>
            )}
            {game.min_playtime && game.max_playtime && (
              <span>{t("playtime", { min: game.min_playtime, max: game.max_playtime })}</span>
            )}
          </div>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mt-5">
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("categories")}
          </h2>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <span
                key={c}
                className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {mechanics.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("mechanics")}
          </h2>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {mechanics.map((m) => (
              <span
                key={m}
                className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {game.description && (
        <p className="mt-6 text-sm whitespace-pre-line text-foreground">{game.description}</p>
      )}
    </div>
  )
}
