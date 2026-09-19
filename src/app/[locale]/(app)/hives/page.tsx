import { getTranslations } from "next-intl/server"
import { requireSession } from "@/lib/dal"
import { getHivesForUser } from "@/features/hives/data"
import { LinkButton } from "@/components/ui/link-button"
import { HiveCard } from "@/features/hives/components/hive-card"
import { JoinHiveSheet } from "@/features/hives/components/join-hive-sheet"
import { Layers } from "lucide-react"

export default async function HivesPage() {
  const session = await requireSession()
  const t = await getTranslations("hives")
  const hives = await getHivesForUser(session.userId)

  return (
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
        {t("title")}
      </h1>

      {hives.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-12 text-center">
          <Layers className="size-8 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="font-display text-lg font-bold text-foreground">
              {t("empty.title")}
            </p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              {t("empty.body")}
            </p>
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <LinkButton href="/hives/new">{t("create.cta")}</LinkButton>
            <JoinHiveSheet />
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {hives.map(
              (h) =>
                h.group && <HiveCard key={h.group.id} hive={h.group} role={h.role} />
            )}
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <LinkButton href="/hives/new" variant="secondary">
              {t("create.cta")}
            </LinkButton>
            <JoinHiveSheet />
          </div>
        </>
      )}
    </div>
  )
}
