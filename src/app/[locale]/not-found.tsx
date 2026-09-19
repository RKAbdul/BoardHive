import { getTranslations } from "next-intl/server"
import { LinkButton } from "@/components/ui/link-button"

export default async function NotFound() {
  const t = await getTranslations("notFound")

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="font-display text-6xl font-extrabold tracking-tight text-primary">
        404
      </span>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("description")}</p>
      </div>
      <LinkButton href="/">{t("cta")}</LinkButton>
    </div>
  )
}
