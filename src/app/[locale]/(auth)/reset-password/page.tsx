import { getTranslations } from "next-intl/server"
import { TrackDots } from "@/components/layout/track-dots"
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form"

export default async function ResetPasswordPage() {
  const t = await getTranslations("auth.resetPassword")

  return (
    <div className="flex flex-col gap-6">
      <TrackDots />
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>
      <ResetPasswordForm />
    </div>
  )
}
