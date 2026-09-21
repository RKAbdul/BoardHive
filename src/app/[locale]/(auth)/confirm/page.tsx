import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { TrackDots } from "@/components/layout/track-dots"
import { AutoConfirm } from "@/features/auth/components/auto-confirm"
import { confirmAuthLink } from "@/features/auth/actions"
import { isValidOtpType } from "@/features/auth/schemas"

export default async function ConfirmPage({
  searchParams,
}: PageProps<"/[locale]/confirm">) {
  const params = await searchParams
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash : null
  const type = typeof params.type === "string" ? params.type : null
  const next = typeof params.next === "string" ? params.next : null

  // Our own email templates always build this link with token_hash — there's
  // no legitimate version of it missing one.
  if (!type || !next || !tokenHash || !isValidOtpType(type)) {
    notFound()
  }

  const t = await getTranslations("auth.confirm")
  const boundConfirm = confirmAuthLink.bind(null, tokenHash, type, next)

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <TrackDots />
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
        {t("title")}
      </h1>
      <AutoConfirm confirm={boundConfirm} />
    </div>
  )
}
