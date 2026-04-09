import { Skeleton } from '@/components/ui'

/** Explorer skeleton — matches table + filters layout */
export function ExplorerSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-baseline justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-8 w-20 rounded-md" />
        ))}
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="border border-[var(--border-1)] rounded-[var(--radius)] bg-[var(--surface-1)]">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b border-[var(--border-1)]">
            <Skeleton className="w-6 h-6 rounded" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24 hidden lg:block" />
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Estrategias skeleton — matches tabs + card grid */
export function EstrategiasSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div>
        <Skeleton className="h-4 w-40 mb-1" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80 mt-1" />
      </div>
      <div className="flex gap-1">
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-52 rounded-[var(--radius)]" />
        ))}
      </div>
    </div>
  )
}

/** Radar skeleton — matches feed + alerts layout */
export function RadarSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-baseline justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
      <div className="flex gap-1">
        <Skeleton className="h-9 w-20 rounded-md" />
        <Skeleton className="h-9 w-20 rounded-md" />
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border border-[var(--border-1)] rounded-[var(--radius)]">
            <Skeleton className="w-8 h-8 rounded" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Dividendos skeleton — matches tabs + calendar */
export function DividendosSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <Skeleton className="h-7 w-32" />
      <div className="flex gap-1">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-[var(--radius)]" />
        <Skeleton className="h-24 rounded-[var(--radius)]" />
        <Skeleton className="h-24 rounded-[var(--radius)]" />
      </div>
      <Skeleton className="h-[300px] rounded-[var(--radius)]" />
    </div>
  )
}

/** Lab skeleton — matches tabs + chart content */
export function LabSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div>
        <Skeleton className="h-4 w-32 mb-1" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-4 w-64 mt-1" />
      </div>
      <div className="flex gap-1">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 rounded-[var(--radius)]" />
        ))}
      </div>
      <Skeleton className="h-[300px] rounded-[var(--radius)]" />
    </div>
  )
}
