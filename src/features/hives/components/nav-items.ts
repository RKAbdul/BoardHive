import { Dices, Layers, LineChart, User } from "lucide-react"
import type { ComponentType } from "react"

export type NavKey = "hives" | "log" | "stats" | "profile"

export const NAV_KEYS: NavKey[] = ["hives", "log", "stats", "profile"]

export const NAV_ICONS: Record<NavKey, ComponentType<{ className?: string }>> = {
  hives: Layers,
  log: Dices,
  stats: LineChart,
  profile: User,
}

// Log and Stats skip the hive-picker page and link straight into the
// user's one hive when they only have one — the common case for this app
// — since landing on the picker only to be immediately redirected again
// was a fully avoidable extra round trip on every tap. Falls back to the
// picker route whenever there isn't exactly one hive to jump straight to.
export function navHref(key: NavKey, soleHiveId: string | null): string {
  switch (key) {
    case "hives":
      return "/hives"
    case "profile":
      return "/profile"
    case "log":
      return soleHiveId ? `/hives/${soleHiveId}/plays/new` : "/log"
    case "stats":
      return soleHiveId ? `/hives/${soleHiveId}/stats` : "/stats"
  }
}

// Stats/Log's own href can now be a /hives/{id}/... path, so it has to be
// checked before the general "any /hives/* path belongs to the Hives tab"
// fallback below, or both tabs would light up at once on those pages.
export function resolveActiveNavKey(pathname: string, soleHiveId: string | null): NavKey | null {
  if (pathname === navHref("stats", soleHiveId)) return "stats"
  if (pathname === navHref("log", soleHiveId)) return "log"
  if (pathname === "/profile") return "profile"
  if (pathname === "/hives" || pathname.startsWith("/hives/")) return "hives"
  return null
}
