import { getTranslations } from "next-intl/server"
import { verifySession } from "@/lib/dal"
import { redirect, Link } from "@/i18n/navigation"
import { getHivesForUser } from "@/features/hives/data"
import { LocaleSwitcher } from "@/components/layout/locale-switcher"
import { LinkButton } from "@/components/ui/link-button"
import type { Locale } from "@/i18n/routing"

export default async function RootPage({ params }: PageProps<"/[locale]">) {
  const { locale } = (await params) as { locale: Locale }
  const session = await verifySession()

  if (session) {
    const hives = await getHivesForUser(session.userId)
    if (hives.length === 1 && hives[0].group) {
      redirect({ href: `/hives/${hives[0].group.id}`, locale })
    }
    redirect({ href: "/hives", locale })
  }

  const t = await getTranslations("landing")

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] md:px-8">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-foreground">
          Boardhive
        </Link>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
        </div>
      </header>

      <main className="flex-1">
        {/* Hero: the mechanism itself — a track of real plays — is the proof, not a screenshot placeholder */}
        <section className="mx-auto max-w-5xl px-4 pt-10 pb-12 md:px-8 md:pt-16 md:pb-20 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <h1 className="font-display text-4xl font-extrabold leading-[0.95] tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted-foreground text-pretty">
              {t("hero.subtitle")}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/signup" size="lg">
                {t("hero.cta")}
              </LinkButton>
              <LinkButton href="/login" size="lg" variant="ghost">
                {t("hero.loginCta")}
              </LinkButton>
            </div>
          </div>

          <HiveTrackDemo />
        </section>

        <section className="border-t border-border bg-card px-4 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {t("steps.title")}
            </h2>
            <ol className="mt-6 flex flex-col gap-6 sm:grid sm:grid-cols-3 sm:gap-8">
              <Step
                n={1}
                title={t("steps.step1Title")}
                body={t("steps.step1Body")}
              />
              <Step
                n={2}
                title={t("steps.step2Title")}
                body={t("steps.step2Body")}
              />
              <Step
                n={3}
                title={t("steps.step3Title")}
                body={t("steps.step3Body")}
              />
            </ol>
          </div>
        </section>

        <section className="px-4 py-14 text-center md:px-8 md:py-20">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-balance text-foreground">
            {t("footerCta.title")}
          </h2>
          <LinkButton href="/signup" size="lg" className="mt-6">
            {t("footerCta.cta")}
          </LinkButton>
        </section>
      </main>
    </div>
  )
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold tabular-nums text-primary-foreground"
        aria-hidden="true"
      >
        {n}
      </span>
      <div>
        <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="mt-1 text-muted-foreground">{body}</p>
      </div>
    </li>
  )
}

/**
 * The demonstration: a hive's play history as beads along a track — this
 * IS the product's signature composition, shown with real-shaped (labeled
 * synthetic) content rather than a generic dashboard screenshot.
 */
async function HiveTrackDemo() {
  const t = await getTranslations("landing.demo")
  const plays = [t("play1"), t("play2"), t("play3")]
  const tokenClasses = ["bg-token-1", "bg-token-3", "bg-token-4"]

  return (
    <div className="mt-10 max-w-md rounded-2xl border border-border bg-card p-5 lg:mt-0 lg:max-w-none">
      <p className="font-display text-sm font-bold tracking-tight text-muted-foreground">
        {t("hiveName")}
      </p>
      <div className="relative mt-4 flex flex-col gap-4 pl-3">
        <span
          className="absolute top-1 bottom-1 left-[7px] w-px bg-border"
          aria-hidden="true"
        />
        {plays.map((play, i) => (
          <div key={play} className="relative flex items-center gap-3">
            <span
              className={`z-10 size-3.5 shrink-0 rounded-full ring-4 ring-card ${tokenClasses[i]}`}
              aria-hidden="true"
            />
            <span className="text-sm text-foreground">{play}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
