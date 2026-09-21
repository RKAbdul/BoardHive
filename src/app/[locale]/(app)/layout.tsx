import { requireSession } from "@/lib/dal"
import { getSoleHiveId } from "@/features/hives/data"
import { BottomNav } from "@/features/hives/components/bottom-nav"
import { SideNav } from "@/features/hives/components/side-nav"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()
  const soleHiveId = await getSoleHiveId(session.userId)

  return (
    <div className="flex min-h-dvh bg-background">
      <SideNav soleHiveId={soleHiveId} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 pb-4">
          <div className="mx-auto w-full max-w-3xl">{children}</div>
        </div>
        <BottomNav soleHiveId={soleHiveId} />
      </div>
    </div>
  )
}
