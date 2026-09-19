import { Dices, Layers, LineChart, User } from "lucide-react"
import type { ComponentType } from "react"

export const NAV_TABS: { href: "/hives" | "/log" | "/stats" | "/profile"; key: NavKey }[] = [
  { href: "/hives", key: "hives" },
  { href: "/log", key: "log" },
  { href: "/stats", key: "stats" },
  { href: "/profile", key: "profile" },
]

export type NavKey = "hives" | "log" | "stats" | "profile"

export const NAV_ICONS: Record<NavKey, ComponentType<{ className?: string }>> = {
  hives: Layers,
  log: Dices,
  stats: LineChart,
  profile: User,
}
