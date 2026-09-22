import { Search } from "lucide-react";
import { Skeleton, SkeletonCard, SkeletonRegion } from "@/components/ui/Skeleton";

export function SearchResultsSkeleton() {
  return (
    <SkeletonRegion label="Loading search results" className="space-y-4">
      {[0, 1].map((section) => (
        <div key={section} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 dark:border-[#213451] dark:bg-[#0A1220]">
          <div className="flex h-13 items-center gap-3 border-b border-slate-200 px-4 dark:border-[#213451]">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-35" />
          </div>
          <div className="p-2.5">
            {[0, 1].map((row) => (
              <SkeletonCard key={row} className="mb-2 flex items-center gap-4 rounded-xl p-4 last:mb-0">
                <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="hidden h-10 w-32 rounded-lg sm:block" />
              </SkeletonCard>
            ))}
          </div>
        </div>
      ))}
    </SkeletonRegion>
  );
}

export function EmptySearchState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm dark:border-[#213451] dark:bg-[#0E1626]">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
        <Search size={28} />
      </div>
      <h2 className="mt-5 text-xl font-extrabold text-slate-950 dark:text-white">No results found</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        We couldn&apos;t find anything matching {query ? <span className="font-semibold text-slate-700 dark:text-slate-300">&ldquo;{query}&rdquo;</span> : "your search"}.
      </p>
      {query ? (
        <button type="button" onClick={onClear} className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700">
          Clear search
        </button>
      ) : null}
    </div>
  );
}
