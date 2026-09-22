import {
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonRegion,
  SkeletonStatCard,
} from "@/components/ui/Skeleton";

export default function EmergenciesSkeleton() {
  return (
    <SkeletonRegion label="Loading emergencies" className="space-y-5 p-6">
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="flex gap-2 overflow-hidden">
        {["w-20", "w-24", "w-28", "w-24", "w-20"].map((width, index) => (
          <Skeleton key={index} className={`h-10 shrink-0 rounded-xl ${width}`} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => <SkeletonStatCard key={index} compact />)}
      </div>
      <SkeletonCard className="p-0"><SkeletonList items={4} className="p-4" /></SkeletonCard>
    </SkeletonRegion>
  );
}
