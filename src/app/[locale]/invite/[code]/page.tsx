import { getTranslations } from "next-intl/server"
import { verifySession } from "@/lib/dal"
import { Link } from "@/i18n/navigation"
import { LinkButton } from "@/components/ui/link-button"
import { JoinInviteButton } from "@/features/hives/components/join-invite-button"
import { TrackDots } from "@/components/layout/track-dots"

export default async function InvitePage({
  params,
}: PageProps<"/[locale]/invite/[code]">) {
  const { code } = await params
  const session = await verifySession()
  const t = await getTranslations("invite")

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <TrackDots />
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 max-w-xs text-muted-foreground">{t("body")}</p>
      </div>

      {session ? (
        <JoinInviteButton code={code} />
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">{t("loginPrompt")}</p>
          <div className="flex gap-3">
            <LinkButton href={{ pathname: "/login", query: { next: `/invite/${code}` } }}>
              {t("loginCta")}
            </LinkButton>
            <Link
              href="/signup"
              className="flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("signupCta")}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
