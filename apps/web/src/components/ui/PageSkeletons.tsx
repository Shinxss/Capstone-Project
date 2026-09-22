import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonList,
  SkeletonRegion,
  SkeletonStatCard,
  SkeletonTable,
  SkeletonText,
} from "./Skeleton";

export function AnalyticsPageSkeleton({ label = "Loading analytics" }: { label?: string }) {
  return (
    <SkeletonRegion label={label} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => <SkeletonStatCard key={index} compact />)}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <SkeletonCard key={index} className="min-h-44"><Skeleton className="h-4 w-40" /><div className="mt-4 grid grid-cols-2 gap-2"><SkeletonStatCard compact /><SkeletonStatCard compact /></div></SkeletonCard>
        ))}
      </div>
      <SkeletonTable rows={6} columns={["w-20", "w-12", "w-12", "w-16", "w-20", "w-20"]} />
    </SkeletonRegion>
  );
}

export function ProfilePageSkeleton() {
  return (
    <SkeletonRegion label="Loading profile" className="space-y-4">
      <SkeletonCard className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SkeletonAvatar className="size-20" />
        <div className="flex-1 space-y-2"><Skeleton className="h-6 w-52 max-w-full" /><Skeleton className="h-3 w-32" /><Skeleton className="h-6 w-24 rounded-full" /></div>
        <Skeleton className="h-10 w-24" />
      </SkeletonCard>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonCard key={index} className="min-h-48"><Skeleton className="h-5 w-40" /><SkeletonText className="mt-5" lines={6} widths={["w-full", "w-4/5", "w-full", "w-3/5", "w-5/6", "w-2/3"]} /></SkeletonCard>
        ))}
      </div>
    </SkeletonRegion>
  );
}

export function SettingsPageSkeleton({ label = "Loading settings" }: { label?: string }) {
  return (
    <SkeletonRegion label={label} className="space-y-4">
      <div className="flex items-center justify-between gap-4"><div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-64 max-w-full" /></div><Skeleton className="h-10 w-24" /></div>
      {Array.from({ length: 3 }, (_, index) => (
        <SkeletonCard key={index} className="space-y-4">
          <Skeleton className="h-5 w-44" />
          {Array.from({ length: 3 }, (_, rowIndex) => (
            <div key={rowIndex} className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 dark:border-[#1C2940]"><div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-3/5" /></div><Skeleton className="h-7 w-12 rounded-full" /></div>
          ))}
        </SkeletonCard>
      ))}
    </SkeletonRegion>
  );
}

export function NotificationsPageSkeleton() {
  return (
    <SkeletonRegion label="Loading notifications" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <SkeletonStatCard key={index} compact />)}</div>
      <SkeletonCard><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_140px]"><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /></div></SkeletonCard>
      <SkeletonList items={5} />
    </SkeletonRegion>
  );
}

export function ActivityLogSkeleton() {
  return (
    <SkeletonRegion label="Loading activity log" className="space-y-4">
      <SkeletonCard><div className="grid gap-3 md:grid-cols-4"><Skeleton className="h-11 w-full md:col-span-2" /><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /></div></SkeletonCard>
      <SkeletonTable rows={7} columns={["w-28", "w-40", "w-24", "w-20", "w-24"]} />
    </SkeletonRegion>
  );
}

export function TableContentSkeleton({
  label,
  rows = 6,
  columns = ["w-36", "w-28", "w-24", "w-20"],
}: {
  label: string;
  rows?: number;
  columns?: string[];
}) {
  return <SkeletonRegion label={label}><SkeletonTable rows={rows} columns={columns} /></SkeletonRegion>;
}
