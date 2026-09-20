import { getTranslations } from "next-intl/server"
import { getHiveMembers } from "@/features/hives/data"
import { getGroupLibraryGames } from "@/features/plays/data"
import { ToolsPanel } from "@/features/tools/components/tools-panel"

export default async function ToolsPage({
  params,
}: PageProps<"/[locale]/hives/[groupId]/tools">) {
  const { groupId } = await params
  const t = await getTranslations("tools")

  const [members, library] = await Promise.all([
    getHiveMembers(groupId),
    getGroupLibraryGames(groupId),
  ])

  const memberList = members
    .filter((m) => m.profile)
    .map((m) => ({ user_id: m.user_id, display_name: m.profile!.display_name }))

  const libraryGames = library.filter((l) => l.game).map((l) => l.game!)

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
        {t("title")}
      </h1>
      <div className="mt-5">
        <ToolsPanel groupId={groupId} members={memberList} libraryGames={libraryGames} />
      </div>
    </div>
  )
}
