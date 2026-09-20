import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { requireSession } from "@/lib/dal"
import { getHiveMembers, getActiveInviteCode } from "@/features/hives/data"
import { getAvatarSignedUrls } from "@/features/profile/data"
import { InviteCodeSection } from "@/features/hives/components/invite-code-section"
import { Link } from "@/i18n/navigation"
import { tokenClassFor } from "@/lib/token-color"
import { ChevronRight } from "lucide-react"

export default async function MembersPage({
  params,
}: PageProps<"/[locale]/hives/[groupId]/members">) {
  const { groupId } = await params
  const t = await getTranslations("members")
  const session = await requireSession()

  const [members, code] = await Promise.all([
    getHiveMembers(groupId),
    getActiveInviteCode(groupId),
  ])
  const avatarUrls = await getAvatarSignedUrls(members.map((m) => m.profile?.avatar_url ?? null))

  return (
    <div className="flex flex-col gap-6">
      <InviteCodeSection groupId={groupId} initialCode={code} />

      <div>
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
          {t("title")}
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {members.map((m) => {
            const name = m.profile?.display_name ?? "—"
            const avatarUrl = m.profile?.avatar_url ? avatarUrls.get(m.profile.avatar_url) : undefined
            const isSelf = m.user_id === session.userId

            return (
              <li key={m.user_id}>
                <Link
                  href={isSelf ? "/profile" : `/hives/${groupId}/members/${m.user_id}`}
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-accent"
                >
                  <span
                    className={`relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white ${tokenClassFor(m.user_id)}`}
                    aria-hidden="true"
                  >
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="" fill sizes="36px" className="object-cover" />
                    ) : (
                      name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                    {name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {m.role === "owner" ? t("owner") : t("member")}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
