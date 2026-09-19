import { getTranslations } from "next-intl/server"
import { getHiveById, getMyRole } from "@/features/hives/data"
import { requireSession } from "@/lib/dal"
import { SettingsForm } from "@/features/hives/components/settings-form"

export default async function HiveSettingsPage({
  params,
}: PageProps<"/[locale]/hives/[groupId]/settings">) {
  const { groupId } = await params
  const session = await requireSession()
  const t = await getTranslations("settings")

  const [hive, role] = await Promise.all([
    getHiveById(groupId),
    getMyRole(groupId, session.userId),
  ])

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
        {t("title")}
      </h1>
      <div className="mt-5">
        <SettingsForm
          groupId={groupId}
          initialName={hive?.name ?? ""}
          isOwner={role === "owner"}
        />
      </div>
    </div>
  )
}
