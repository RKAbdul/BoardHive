import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { TrackDots } from "@/components/layout/track-dots"
import { Button } from "@/components/ui/button"
import { confirmAuthLink } from "@/features/auth/actions"
import { isValidOtpType } from "@/features/auth/schemas"

export default async function ConfirmPage({
  searchParams,
}: PageProps<"/[locale]/confirm">) {
  const params = await searchParams
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash : null
  const code = typeof params.code === "string" ? params.code : null
  const type = typeof params.type === "string" ? params.type : null
  const next = typeof params.next === "string" ? params.next : null

  if (!type || !next || !isValidOtpType(type)) {
    notFound()
  }

  // A real link always carries a `code` (PKCE) or a `token_hash`
  // (implicit/OTP) — there's no legitimate link with neither.
  if (!tokenHash && !code) {
    notFound()
  }

  const t = await getTranslations("auth.confirm")
  const boundConfirm = confirmAuthLink.bind(null, tokenHash, code, type, next)

  return (
    <div className="flex flex-col gap-6">
      <TrackDots />
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("body")}</p>
      </div>
      <form action={boundConfirm}>
        <Button type="submit" size="lg" className="w-full">
          {t("continue")}
        </Button>
      </form>
    </div>
  )
}
