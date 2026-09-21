"use client"

import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"
import { NAV_ICONS, NAV_KEYS, navHref, resolveActiveNavKey } from "@/features/hives/components/nav-items"

export function BottomNav({ soleHiveId }: { soleHiveId: string | null }) {
  const t = useTranslations("nav")
  const pathname = usePathname()
  const activeKey = resolveActiveNavKey(pathname, soleHiveId)

  return (
    <nav
      // will-change-transform: a known, low-risk nudge for WebKit to give
      // this its own compositing layer, which helps with various WebKit
      // position-recalculation glitches in general. Not a confirmed fix for
      // the specific iOS 26 Safari bug where `position: sticky; bottom: 0`
      // stops tracking the viewport as the toolbar hides/shows on scroll —
      // that's an open, unresolved WebKit bug (Apple Developer Forums
      // thread #801028) with no known reliable fix as of this writing.
      className="sticky bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] will-change-transform md:hidden"
      aria-label={t("hives")}
    >
      <ul className="flex items-stretch justify-around">
        {NAV_KEYS.map((key) => {
          const href = navHref(key, soleHiveId)
          const Icon = NAV_ICONS[key]
          const active = key === activeKey
          const label = key === "log" ? t("logPlay") : t(key as "hives" | "stats" | "profile")

          return (
            <li key={key} className="flex-1">
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
