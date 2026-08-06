import { Map, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

type Props = { loading: boolean; onRefresh: () => void };

export default function InProgressTasksHeader({ loading, onRefresh }: Props) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">In Progress Tasks</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Accepted dispatches grouped by emergency.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#1C2940] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]">
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
        <Link to="/lgu/live-map" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">
          <Map size={18} /> Open Live Map
        </Link>
      </div>
    </header>
  );
}
