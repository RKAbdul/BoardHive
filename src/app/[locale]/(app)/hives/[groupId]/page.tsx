import { getTranslations } from "next-intl/server"
import { getRecentPlaysForHive } from "@/features/plays/data"
import { LinkButton } from "@/components/ui/link-button"
import { PlayTrack } from "@/features/plays/components/play-track"
import { Dices } from "lucide-react"

export default async function HiveHomePage({
  params,
}: PageProps<"/[locale]/hives/[groupId]">) {
  const { groupId } = await params
  const t = await getTranslations("hives.home")
  const plays = await getRecentPlaysForHive(groupId, 8)

  return (
    <div className="flex flex-col gap-5">
      <LinkButton href={`/hives/${groupId}/plays/new`} size="lg" className="gap-2">
        <Dices className="size-4" aria-hidden="true" />
        {t("logPlay")}
      </LinkButton>

      <div>
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
          {t("recentPlays")}
        </h2>

        {plays.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("noPlays")}</p>
        ) : (
          <div className="mt-4">
            <PlayTrack plays={plays} groupId={groupId} />
          </div>
        )}
      </div>
    </div>
  )
}
