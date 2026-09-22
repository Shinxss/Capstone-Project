import {
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonMap,
  SkeletonRegion,
  SkeletonStatCard,
} from "@/components/ui/Skeleton";

export default function LguDashboardSkeleton() {
  return (
    <SkeletonRegion label="Loading dashboard" className="space-y-4 px-6 py-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <SkeletonStatCard key={index} />)}
      </div>
      <SkeletonMap className="h-125" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SkeletonCard className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-[#1C2940]">
            <div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-3 w-64 max-w-full" /></div>
            <Skeleton className="h-8 w-24" />
          </div>
          <SkeletonList items={3} />
        </SkeletonCard>
        <SkeletonCard>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-3 w-28" />
          <div className="mt-5 space-y-5">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex gap-3"><Skeleton className="mt-1 size-2 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-20" /></div></div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    </SkeletonRegion>
  );
}
