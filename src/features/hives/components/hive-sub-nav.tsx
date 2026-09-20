"use client"

import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"

export function HiveSubNav({ groupId }: { groupId: string }) {
  const t = useTranslations("hives.home")
  const pathname = usePathname()
  const base = `/hives/${groupId}`

  const tabs = [
    { href: base, label: t("recentPlays"), match: (p: string) => p === base },
    {
      href: `${base}/plays`,
      label: t("viewAll"),
      // Exact match, or a play detail page (/plays/[playId]) — but not
      // /plays/new, which isn't a tab of its own and shouldn't highlight one.
      match: (p: string) =>
        p === `${base}/plays` ||
        (p.startsWith(`${base}/plays/`) && !p.startsWith(`${base}/plays/new`)),
    },
    { href: `${base}/stats`, label: t("stats"), match: (p: string) => p.startsWith(`${base}/stats`) },
    { href: `${base}/library`, label: t("library"), match: (p: string) => p.startsWith(`${base}/library`) },
    { href: `${base}/members`, label: t("members"), match: (p: string) => p.startsWith(`${base}/members`) },
    { href: `${base}/tools`, label: t("tools"), match: (p: string) => p.startsWith(`${base}/tools`) },
    { href: `${base}/settings`, label: t("settings"), match: (p: string) => p.startsWith(`${base}/settings`) },
  ]

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border px-4" aria-label={t("recentPlays")}>
      {tabs.map((tab) => {
        const active = tab.match(pathname)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 border-b-2 px-2 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
