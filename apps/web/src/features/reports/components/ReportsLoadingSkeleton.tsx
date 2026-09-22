import { Skeleton, SkeletonChart, SkeletonRegion, SkeletonStatCard } from "@/components/ui/Skeleton";

export default function ReportsLoadingSkeleton() {
  return (
    <SkeletonRegion label="Loading reports" className="px-4 py-4 sm:px-5 lg:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3"><Skeleton className="h-11 w-11" /><div><Skeleton className="h-5 w-48" /><Skeleton className="mt-2 h-3 w-64 max-w-full" /></div></div>
        <Skeleton className="hidden h-10 w-[560px] xl:block" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => <SkeletonStatCard key={index} />)}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        {Array.from({ length: 6 }, (_, index) => <SkeletonChart key={index} className={`${index < 2 ? "min-h-[320px]" : "min-h-[235px]"} xl:col-span-6`} />)}
      </div>
    </SkeletonRegion>
  );
}
