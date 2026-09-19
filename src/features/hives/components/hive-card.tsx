import { Link } from "@/i18n/navigation"
import { ChevronRight } from "lucide-react"

const TOKEN_CLASSES = ["bg-token-1", "bg-token-2", "bg-token-3", "bg-token-4", "bg-token-5", "bg-token-6"]

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
  const tokenClass =
    TOKEN_CLASSES[
      Math.abs(hashCode(hive.id)) % TOKEN_CLASSES.length
    ]

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

function hashCode(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}
