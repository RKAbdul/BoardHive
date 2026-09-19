import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { TrackDots } from "@/components/layout/track-dots"
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth.forgotPassword")

  return (
    <div className="flex flex-col gap-6">
      <TrackDots />
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  )
}
