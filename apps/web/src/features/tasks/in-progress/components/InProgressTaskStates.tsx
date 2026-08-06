import { Clock3, RefreshCw, SearchX } from "lucide-react";

export function InProgressTasksSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading in-progress tasks" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#1C2940] dark:bg-[#0B1220]"><div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700" /><div className="ml-14 -mt-9 h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" /><div className="ml-14 mt-2 h-7 w-14 rounded bg-slate-200 dark:bg-slate-700" /></div>)}</div>
      <div className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-[#1C2940] dark:bg-[#0B1220]" />
      {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#1C2940] dark:bg-[#0B1220]"><div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-700" /><div className="mt-4 h-3 w-72 max-w-full rounded bg-slate-100 dark:bg-slate-800" /></div>)}
    </div>
  );
}

export function InProgressTasksEmptyState({ filtersActive, onClear }: { filtersActive: boolean; onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-[#2A3A56] dark:bg-[#0B1220]">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-[#162238] dark:text-slate-300">{filtersActive ? <SearchX size={27} /> : <Clock3 size={27} />}</span>
      <h2 className="mt-4 text-base font-black text-slate-900 dark:text-white">No in-progress tasks found</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{filtersActive ? "No accepted dispatches match the current filters. Clear or adjust them to broaden the results." : "Accepted dispatches will appear here once a responder takes an emergency assignment."}</p>
      {filtersActive ? <button type="button" onClick={onClear} className="mt-5 h-10 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">Clear Filters</button> : null}
    </div>
  );
}

export function InProgressTasksErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-500/25 dark:bg-red-500/10">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-white text-red-600 shadow-sm dark:bg-[#0B1220] dark:text-red-300"><RefreshCw size={22} /></span>
      <h2 className="mt-4 font-black text-red-900 dark:text-red-100">We couldn’t load in-progress tasks</h2>
      <p className="mt-1 text-sm text-red-700 dark:text-red-200">Please check your connection and try again.</p>
      <button type="button" onClick={onRetry} className="mt-5 h-10 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">Retry</button>
    </div>
  );
}
