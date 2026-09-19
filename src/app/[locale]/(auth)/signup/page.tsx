import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { TrackDots } from "@/components/layout/track-dots"
import { SignupForm } from "@/features/auth/components/signup-form"

export default async function SignupPage() {
  const t = await getTranslations("auth.signup")

  return (
    <div className="flex flex-col gap-6">
      <TrackDots />
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-muted-foreground">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          {t("loginLink")}
        </Link>
      </p>
    </div>
  )
}
