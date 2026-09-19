"use client"

import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"
import { NAV_ICONS, NAV_TABS } from "@/features/hives/components/nav-items"
import { logout } from "@/features/auth/actions"
import { LogOut } from "lucide-react"

export function SideNav() {
  const t = useTranslations("nav")
  const tCommon = useTranslations("auth")
  const pathname = usePathname()

  return (
    <nav
      className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-1 border-r border-border bg-card px-3 py-6 md:flex"
      aria-label={t("hives")}
    >
      <Link
        href="/hives"
        className="mb-6 px-2 font-display text-xl font-bold tracking-tight text-foreground"
      >
        Boardhive
      </Link>

      <ul className="flex flex-1 flex-col gap-1">
        {NAV_TABS.map(({ href, key }) => {
          const Icon = NAV_ICONS[key]
          const active =
            href === "/hives"
              ? pathname === "/hives" || pathname.startsWith("/hives/")
              : pathname === href

          const label = key === "log" ? t("logPlay") : t(key as "hives" | "stats" | "profile")

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                }`}
              >
                <Icon className={`size-4 ${active ? "text-primary" : ""}`} />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>

      <form action={logout}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden="true" />
          {tCommon("logout")}
        </button>
      </form>
    </nav>
  )
}
