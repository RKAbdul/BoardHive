import { getTranslations } from "next-intl/server"
import { getPlaysForHive } from "@/features/plays/data"
import { PlayTrack } from "@/features/plays/components/play-track"

export default async function PlaysListPage({
  params,
}: PageProps<"/[locale]/hives/[groupId]/plays">) {
  const { groupId } = await params
  const t = await getTranslations("plays.list")
  const plays = await getPlaysForHive(groupId)

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
        {t("title")}
      </h1>
      {plays.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-5">
          <PlayTrack plays={plays} groupId={groupId} />
        </div>
      )}
    </div>
  )
}
