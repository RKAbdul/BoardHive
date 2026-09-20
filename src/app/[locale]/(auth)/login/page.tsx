import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { TrackDots } from "@/components/layout/track-dots"
import { LoginForm } from "@/features/auth/components/login-form"

export default async function LoginPage({
  searchParams,
}: PageProps<"/[locale]/login">) {
  const t = await getTranslations("auth.login")
  const { next, error } = await searchParams
  const nextHref = typeof next === "string" ? next : undefined
  const linkError = error === "invalid_link"
  const alreadyUsed = error === "link_already_used"

  return (
    <div className="flex flex-col gap-6">
      <TrackDots />
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>
      {linkError && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {t("invalidLink")}
        </p>
      )}
      {alreadyUsed && (
        <p role="status" className="rounded-lg bg-secondary p-4 text-sm text-secondary-foreground">
          {t("alreadyConfirmed")}
        </p>
      )}
      <LoginForm nextHref={nextHref} />
      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
          {t("signUpLink")}
        </Link>
      </p>
    </div>
  )
}
