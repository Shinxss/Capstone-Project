import { SearchX, UsersRound } from "lucide-react";

export default function DispatchRespondersEmptyState({ noAvailable, hasActiveFilters, onClearFilters }: { noAvailable: boolean; hasActiveFilters: boolean; onClearFilters: () => void }) {
  const Icon = noAvailable ? UsersRound : SearchX;
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-[#17243A] dark:text-slate-300"><Icon size={25} /></div>
      <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">{noAvailable ? "No responders are currently available for dispatch" : "No matching responders found"}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{noAvailable ? "Unavailable responders remain visible for operational reference and cannot be selected." : "Try adjusting the filters or search to see more responders."}</p>
      {hasActiveFilters ? <button type="button" onClick={onClearFilters} className="mt-5 h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-[#2B3A55] dark:text-slate-200 dark:hover:bg-[#17243A]">Clear Filters</button> : null}
    </div>
  );
}
