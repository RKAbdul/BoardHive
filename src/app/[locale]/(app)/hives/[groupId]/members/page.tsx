import { getTranslations } from "next-intl/server"
import { getHiveMembers, getActiveInviteCode } from "@/features/hives/data"
import { InviteCodeSection } from "@/features/hives/components/invite-code-section"

export default async function MembersPage({
  params,
}: PageProps<"/[locale]/hives/[groupId]/members">) {
  const { groupId } = await params
  const t = await getTranslations("members")

  const [members, code] = await Promise.all([
    getHiveMembers(groupId),
    getActiveInviteCode(groupId),
  ])

  return (
    <div className="flex flex-col gap-6">
      <InviteCodeSection groupId={groupId} initialCode={code} />

      <div>
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
          {t("title")}
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {members.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className="font-medium text-foreground">
                {m.profile?.display_name ?? "—"}
              </span>
              <span className="text-xs text-muted-foreground">
                {m.role === "owner" ? t("owner") : t("member")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
