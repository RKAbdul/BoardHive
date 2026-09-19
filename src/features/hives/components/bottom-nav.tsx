"use client"

import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"
import { NAV_ICONS, NAV_TABS } from "@/features/hives/components/nav-items"

export function BottomNav() {
  const t = useTranslations("nav")
  const pathname = usePathname()

  return (
    <nav
      className="sticky bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label={t("hives")}
    >
      <ul className="flex items-stretch justify-around">
        {NAV_TABS.map(({ href, key }) => {
          const Icon = NAV_ICONS[key]
          const active =
            href === "/hives"
              ? pathname === "/hives" || pathname.startsWith("/hives/")
              : pathname === href

          const label = key === "log" ? t("logPlay") : t(key as "hives" | "stats" | "profile")

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`size-5 ${active ? "text-primary" : ""}`} />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
