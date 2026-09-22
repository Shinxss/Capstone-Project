import {
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonRegion,
  SkeletonStatCard,
  SkeletonTable,
  SkeletonText,
} from "@/components/ui/Skeleton";

export function TasksForReviewSkeleton() {
  return (
    <SkeletonRegion label="Loading tasks for review" className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <SkeletonStatCard key={index} compact />)}
      </div>
      <SkeletonCard><div className="grid gap-3 md:grid-cols-3"><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /></div></SkeletonCard>
      <div className="grid min-h-[34rem] gap-4 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,2fr)]">
        <SkeletonCard><Skeleton className="mb-4 h-5 w-32" /><SkeletonList items={4} /></SkeletonCard>
        <SkeletonCard><Skeleton className="h-7 w-2/5" /><SkeletonText className="mt-4" lines={4} widths={["w-full", "w-4/5", "w-full", "w-3/5"]} /><Skeleton className="mt-6 h-56 w-full rounded-xl" /></SkeletonCard>
      </div>
    </SkeletonRegion>
  );
}

export function CanceledTasksSkeleton() {
  return (
    <SkeletonRegion label="Loading canceled tasks" className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <SkeletonStatCard key={index} compact />)}
      </div>
      <SkeletonCard><div className="grid gap-3 md:grid-cols-4"><Skeleton className="h-11 w-full md:col-span-2" /><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /></div></SkeletonCard>
      <SkeletonTable rows={5} columns={["w-36", "w-28", "w-24", "w-20", "w-20"]} />
    </SkeletonRegion>
  );
}
