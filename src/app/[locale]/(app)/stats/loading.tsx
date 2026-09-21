import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-6">
      <Skeleton className="h-8 w-36" />
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[68px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
