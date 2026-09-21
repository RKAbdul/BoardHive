import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-8 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-6">
      <Skeleton className="h-9 w-32" />
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="size-24 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
    </div>
  )
}
