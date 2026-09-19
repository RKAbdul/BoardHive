import { getTranslations } from "next-intl/server"
import { getGroupLibraryGames } from "@/features/plays/data"
import { getHiveMembers } from "@/features/hives/data"
import { NewPlayForm } from "@/features/plays/components/new-play-form"

export default async function NewPlayPage({
  params,
}: PageProps<"/[locale]/hives/[groupId]/plays/new">) {
  const { groupId } = await params
  const t = await getTranslations("plays.new")

  const [members, library] = await Promise.all([
    getHiveMembers(groupId),
    getGroupLibraryGames(groupId),
  ])

  const memberList = members
    .filter((m) => m.profile)
    .map((m) => ({ user_id: m.user_id, display_name: m.profile!.display_name }))

  const libraryGames = library
    .filter((l) => l.game)
    .map((l) => l.game!)

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
        {t("title")}
      </h1>
      <div className="mt-5">
        <NewPlayForm groupId={groupId} members={memberList} libraryGames={libraryGames} />
      </div>
    </div>
  )
}
