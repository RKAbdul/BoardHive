import Image from "next/image"
import { notFound } from "next/navigation"
import { getFormatter, getTranslations } from "next-intl/server"
import { requireSession } from "@/lib/dal"
import { getHiveMember, getMemberHiveStats } from "@/features/hives/data"
import { getMyLibrary } from "@/features/library/data"
import { getAvatarSignedUrl } from "@/features/profile/data"
import { Link, redirect } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { tokenClassFor } from "@/lib/token-color"
import { Dices } from "lucide-react"

export default async function MemberProfilePage({
  params,
}: PageProps<"/[locale]/hives/[groupId]/members/[userId]">) {
  const { groupId, userId, locale } = (await params) as {
    groupId: string
    userId: string
    locale: Locale
  }
  const session = await requireSession()

  // Own row in the members list already routes to /profile — this only
  // catches a directly-typed or bookmarked URL to one's own member page.
  if (userId === session.userId) {
    redirect({ href: "/profile", locale })
  }

  const member = await getHiveMember(groupId, userId)
  if (!member) {
    notFound()
  }

  const [stats, library, avatarUrl] = await Promise.all([
    getMemberHiveStats(groupId, userId),
    getMyLibrary(userId),
    getAvatarSignedUrl(member.profile?.avatar_url ?? null),
  ])

  const t = await getTranslations("members")
  const tProfile = await getTranslations("profile")
  const tLibrary = await getTranslations("library")
  const format = await getFormatter()
  const name = member.profile?.display_name ?? "—"

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <span
          className={`relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full font-display text-2xl font-bold text-white ${tokenClassFor(userId)}`}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {name}
          </h1>
          <p className="text-xs text-muted-foreground">
            {member.role === "owner" ? t("owner") : t("member")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card">
        <div className="flex flex-col items-center gap-0.5 px-2 py-3">
          <span className="font-display text-xl font-bold tabular-nums text-foreground">
            {stats.totalPlays}
          </span>
          <span className="text-center text-xs text-muted-foreground">
            {tProfile("stats.plays", { count: stats.totalPlays })}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2 py-3">
          <span className="font-display text-xl font-bold tabular-nums text-foreground">
            {stats.totalWins}
          </span>
          <span className="text-center text-xs text-muted-foreground">
            {tProfile("stats.wins", { count: stats.totalWins })}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2 py-3">
          <span className="font-display text-xl font-bold tabular-nums text-foreground">
            {format.number(stats.winRate, { style: "percent", maximumFractionDigits: 0 })}
          </span>
          <span className="text-center text-xs text-muted-foreground">
            {tProfile("stats.winRate")}
          </span>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
          {tLibrary("groupTitle", { name })}
        </h2>
        {library.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {tLibrary("memberEmpty", { name })}
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {library.map(
              (g) =>
                g.game && (
                  <li key={g.game.bgg_id} className="min-w-0">
                    <Link
                      href={`/hives/${groupId}/games/${g.game.bgg_id}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:bg-accent"
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
                      <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                        {g.game.name}
                      </span>
                    </Link>
                  </li>
                )
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
