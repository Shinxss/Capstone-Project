import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonRegion,
  SkeletonStatCard,
  SkeletonTable,
  SkeletonText,
} from "@/components/ui/Skeleton";

export function ApplicantsSkeleton() {
  return (
    <SkeletonRegion label="Loading volunteer applicants" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => <SkeletonStatCard key={index} compact />)}
      </div>
      <SkeletonCard className="flex min-h-24 flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Skeleton className="h-10 w-full rounded-xl md:max-w-md" />
        <div className="flex gap-2"><Skeleton className="h-10 w-16" /><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-24" /></div>
      </SkeletonCard>
      <SkeletonTable rows={5} columns={["w-36", "w-24", "w-24", "w-20", "w-20"]} />
    </SkeletonRegion>
  );
}

export function VerifiedVolunteersSkeleton() {
  return (
    <SkeletonRegion label="Loading verified volunteers" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <SkeletonStatCard key={index} />)}
      </div>
      <SkeletonCard><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_140px]"><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /></div></SkeletonCard>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonCard key={index} className="min-h-56">
            <div className="flex gap-3"><SkeletonAvatar className="size-14" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/5" /><Skeleton className="h-3 w-2/5" /></div><Skeleton className="h-6 w-16 rounded-full" /></div>
            <SkeletonText className="mt-5" lines={3} widths={["w-full", "w-4/5", "w-2/3"]} />
            <div className="mt-5 grid grid-cols-3 gap-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          </SkeletonCard>
        ))}
      </div>
    </SkeletonRegion>
  );
}

export function VolunteerDetailsSkeleton({ label = "Loading volunteer details" }: { label?: string }) {
  return (
    <SkeletonRegion label={label} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <SkeletonCard key={index} className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <SkeletonText lines={5} widths={["w-full", "w-4/5", "w-full", "w-3/5", "w-2/3"]} />
        </SkeletonCard>
      ))}
    </SkeletonRegion>
  );
}
