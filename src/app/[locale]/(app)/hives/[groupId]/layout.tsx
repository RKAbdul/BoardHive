import { notFound } from "next/navigation"
import { getHiveById } from "@/features/hives/data"
import { HiveSubNav } from "@/features/hives/components/hive-sub-nav"
import { Link } from "@/i18n/navigation"

export default async function HiveLayout({
  children,
  params,
}: LayoutProps<"/[locale]/hives/[groupId]">) {
  const { groupId } = await params
  const hive = await getHiveById(groupId)

  // A non-member sees the same thing as a nonexistent hive — no
  // group-existence leakage through URLs.
  if (!hive) {
    notFound()
  }

  return (
    <div>
      <header className="border-b border-border px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <h1 className="truncate">
          <Link
            href={`/hives/${groupId}`}
            className="font-display text-2xl font-bold tracking-tight text-foreground"
          >
            {hive.name}
          </Link>
        </h1>
      </header>
      <HiveSubNav groupId={groupId} />
      <div className="px-4 py-5">{children}</div>
    </div>
  )
}
