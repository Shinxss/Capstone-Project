import { Skeleton, SkeletonCard, SkeletonRegion } from "@/components/ui/Skeleton";

export default function DispatchRespondersSkeleton() {
  return (
    <SkeletonRegion label="Loading responders" className="space-y-3 p-4 sm:p-6">
      {Array.from({ length: 4 }, (_, index) => (
        <SkeletonCard key={index} className="p-4">
          <div className="flex gap-3"><Skeleton className="h-16 w-16 shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-44 max-w-full" /><Skeleton className="h-3 w-28" /><div className="flex gap-2"><Skeleton className="h-6 w-16" /><Skeleton className="h-6 w-20" /></div></div><Skeleton className="h-9 w-9" /></div>
        </SkeletonCard>
      ))}
    </SkeletonRegion>
  );
}
