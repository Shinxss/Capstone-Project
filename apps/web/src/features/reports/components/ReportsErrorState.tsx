import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ReportsErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return <div className="px-4 py-6 sm:px-5 lg:px-6"><div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm dark:border-rose-500/20 dark:bg-[#0B1220]"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"><AlertTriangle size={24} /></div><h1 className="mt-4 text-lg font-bold text-slate-950 dark:text-slate-100">Unable to load reports</h1><p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{error}</p><button type="button" onClick={onRetry} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"><RefreshCw size={16} />Retry</button></div></div>;
}
