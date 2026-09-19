import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { requireSession } from "@/lib/dal"
import { getMyLibrary } from "@/features/library/data"
import { AddGameSheet } from "@/features/library/components/add-game-sheet"
import { RemoveFromLibraryButton } from "@/features/library/components/remove-from-library-button"
import { Dices } from "lucide-react"

export default async function LibraryPage() {
  const session = await requireSession()
  const t = await getTranslations("library")
  const games = await getMyLibrary(session.userId)

  return (
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <AddGameSheet />
      </div>

      {games.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {games.map(
            (g) =>
              g.game && (
                <li
                  key={g.game.bgg_id}
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
                >
                  <Link
                    href={`/games/${g.game.bgg_id}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                      {g.game.image_url ? (
                        <Image
                          src={g.game.image_url}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      ) : (
                        <Dices className="size-4 text-muted-foreground" aria-hidden="true" />
                      )}
                    </span>
                    <span className="flex-1 truncate font-medium text-foreground">
                      {g.game.name}
                    </span>
                  </Link>
                  <RemoveFromLibraryButton gameId={g.game.bgg_id} />
                </li>
              )
          )}
        </ul>
      )}
    </div>
  )
}
