import { Link } from "@/i18n/navigation"
import { tokenClassFor } from "@/lib/token-color"
import { ChevronRight } from "lucide-react"

export function HiveCard({
  hive,
  hrefSuffix = "",
}: {
  hive: { id: string; name: string; created_at: string }
  role: string
  hrefSuffix?: string
}) {
  // A stable-per-hive token color, so the same hive always reads the same
  // "piece color" across the app — not random on every render.
  const tokenClass = tokenClassFor(hive.id)

  return (
    <Link
      href={`/hives/${hive.id}${hrefSuffix}`}
      className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:bg-accent"
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-full font-display text-base font-bold text-white ${tokenClass}`}
        aria-hidden="true"
      >
        {hive.name.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-base font-bold tracking-tight text-foreground">
          {hive.name}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}
