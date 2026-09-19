import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { getGroupLibraryGames } from "@/features/plays/data"
import { Link } from "@/i18n/navigation"
import { Dices } from "lucide-react"

export default async function HiveLibraryPage({
  params,
}: PageProps<"/[locale]/hives/[groupId]/library">) {
  const { groupId } = await params
  const t = await getTranslations("library")
  const entries = await getGroupLibraryGames(groupId, 100)

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("groupEmpty")}</p>
  }

  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {entries.map(
        (e) =>
          e.game && (
            <li key={e.game.bgg_id} className="min-w-0">
              <Link
                href={`/hives/${groupId}/games/${e.game.bgg_id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:bg-accent"
              >
                <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                  {e.game.image_url ? (
                    <Image
                      src={e.game.image_url}
                      alt=""
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    <Dices className="size-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">{e.game.name}</span>
                <span className="flex shrink-0 flex-col items-end gap-0.5 text-xs text-muted-foreground">
                  <span>{t("ownedBy", { count: e.owner_count ?? 0 })}</span>
                  <span>{t("playCount", { count: e.play_count })}</span>
                </span>
              </Link>
            </li>
          )
      )}
    </ul>
  )
}
