import { Skeleton, SkeletonCard, SkeletonRegion, SkeletonStatCard, SkeletonTable } from "@/components/ui/Skeleton";

export default function CompletedTasksSkeleton() {
  return (
    <SkeletonRegion label="Loading completed tasks" className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <SkeletonStatCard key={index} />)}
      </div>
      <SkeletonCard className="p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-11 w-full" /></div>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2"><Skeleton className="h-10 w-28" /><Skeleton className="h-10 w-24" /></div>
      </SkeletonCard>
      <SkeletonTable rows={5} columns={["w-32", "w-28", "w-24", "w-20"]} />
    </SkeletonRegion>
  );
}
