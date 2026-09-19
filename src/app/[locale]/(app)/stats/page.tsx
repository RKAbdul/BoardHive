import { getTranslations } from "next-intl/server"
import { requireSession } from "@/lib/dal"
import { redirect } from "@/i18n/navigation"
import { getHivesForUser } from "@/features/hives/data"
import { HiveCard } from "@/features/hives/components/hive-card"
import type { Locale } from "@/i18n/routing"

export default async function StatsPickerPage({ params }: PageProps<"/[locale]/stats">) {
  const { locale } = (await params) as { locale: Locale }
  const session = await requireSession()
  const hives = await getHivesForUser(session.userId)

  if (hives.length === 1 && hives[0].group) {
    redirect({ href: `/hives/${hives[0].group.id}/stats`, locale })
  }

  const t = await getTranslations("stats")

  return (
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-6">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
        {t("pickHive")}
      </h1>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {hives.map(
          (h) =>
            h.group && (
              <HiveCard key={h.group.id} hive={h.group} role={h.role} hrefSuffix="/stats" />
            )
        )}
      </div>
    </div>
  )
}
