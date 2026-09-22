import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-slate-200/90 motion-reduce:animate-none dark:bg-[#1A2942]",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonRegion({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className} aria-busy="true" aria-label={label} role="status">
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function SkeletonText({
  lines = 1,
  widths = ["w-full"],
  className,
}: {
  lines?: number;
  widths?: string[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={cn("h-3.5", widths[index % widths.length] ?? "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ className }: { className?: string }) {
  return <Skeleton className={cn("size-11 shrink-0 rounded-full", className)} />;
}

export function SkeletonCard({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#1C2940] dark:bg-[#0B1220]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SkeletonStatCard({ compact = false }: { compact?: boolean }) {
  return (
    <SkeletonCard className={cn("flex items-center gap-3", compact ? "min-h-24" : "min-h-28")}>
      <Skeleton className="size-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3 w-24 max-w-full" />
        <Skeleton className="h-7 w-16" />
        {!compact ? <Skeleton className="h-3 w-32 max-w-full" /> : null}
      </div>
    </SkeletonCard>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = ["w-40", "w-28", "w-24", "w-20"],
  className,
}: {
  rows?: number;
  columns?: string[];
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1C2940] dark:bg-[#0B1220]",
        className
      )}
    >
      <div
        className="grid gap-4 bg-slate-50 px-5 py-3 dark:bg-[#0E1626]"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((width, index) => (
          <Skeleton key={index} className={cn("h-3 max-w-full", width)} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid min-h-16 items-center gap-4 border-t border-slate-100 px-5 py-3 dark:border-[#1C2940]"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {columns.map((width, columnIndex) => (
            <Skeleton
              key={columnIndex}
              className={cn(
                columnIndex === columns.length - 1 ? "h-8 rounded-lg" : "h-3.5",
                "max-w-full",
                width
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({
  items = 4,
  className,
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden="true">
      {Array.from({ length: items }, (_, index) => (
        <SkeletonCard key={index} className="flex min-h-24 items-start gap-3">
          <Skeleton className="size-12 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <SkeletonText lines={2} widths={["w-4/5", "w-3/5"]} />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </SkeletonCard>
      ))}
    </div>
  );
}

export function SkeletonMap({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative min-h-125 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-[#1C2940] dark:bg-[#0E1626]",
        className
      )}
    >
      <Skeleton className="absolute right-4 top-4 h-8 w-40 rounded-full" />
      <Skeleton className="absolute bottom-4 left-4 h-16 w-44 rounded-xl" />
      <Skeleton className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full" />
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <SkeletonCard className={cn("min-h-72", className)}>
      <Skeleton className="h-5 w-44" />
      <Skeleton className="mt-2 h-3 w-60 max-w-full" />
      <Skeleton className="mt-5 h-48 w-full rounded-xl" />
      <div className="mt-4 flex gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </SkeletonCard>
  );
}
