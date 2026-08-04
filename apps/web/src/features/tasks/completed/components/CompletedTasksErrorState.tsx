import { AlertTriangle, RefreshCw } from "lucide-react";

export default function CompletedTasksErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-red-200 bg-white px-6 py-12 text-center dark:border-red-500/25 dark:bg-[#0B1220]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"><AlertTriangle size={26} /></div>
      <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Completed tasks could not be loaded</h2>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">Check your connection and try again. Your task records have not been changed.</p>
      <button type="button" onClick={onRetry} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">
        <RefreshCw size={16} /> Retry
      </button>
    </div>
  );
}
