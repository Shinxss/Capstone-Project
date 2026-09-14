import { Download, FileText, MoreVertical } from "lucide-react";
import type { GeneratedReport } from "../models/reports.types";

export default function RecentGeneratedReportsCard({ reports, onDownload }: { reports: GeneratedReport[]; onDownload: () => void }) {
  return (
    <article className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_6px_20px_-18px_rgba(15,23,42,0.28)] dark:border-[#162544] dark:bg-[#0B1220]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5"><FileText size={20} className="mt-0.5 text-rose-600" /><div><h2 className="text-[17px] font-bold leading-tight text-slate-950 dark:text-slate-100">Recent Generated Reports</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Your recently generated reports</p></div></div>
        <button type="button" className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400">View All</button>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-[11px]">
          <thead><tr className="bg-slate-50 text-slate-500 dark:bg-[#0E1626] dark:text-slate-400"><th className="rounded-l-lg px-2 py-2 font-semibold">Report Name</th><th className="px-2 py-2 font-semibold">Type</th><th className="px-2 py-2 font-semibold">Generated On</th><th className="px-2 py-2 font-semibold">Status</th><th className="rounded-r-lg px-2 py-2 text-center font-semibold">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {reports.map((report) => <tr key={report.id}><td className="px-2 py-2"><span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200"><FileText size={14} className="shrink-0" />{report.name}</span></td><td className="px-2 py-2"><span className={`rounded-full px-2 py-1 font-medium ${report.type === "Quarterly" ? "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300" : "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"}`}>{report.type}</span></td><td className="whitespace-nowrap px-2 py-2 text-slate-500 dark:text-slate-400">{report.generatedOn}</td><td className="px-2 py-2"><span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">{report.status}</span></td><td className="px-2 py-2"><span className="flex items-center justify-center gap-1"><button type="button" onClick={onDownload} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label={`Download ${report.name}`}><Download size={14} /></button><button type="button" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" aria-label={`More options for ${report.name}`}><MoreVertical size={14} /></button></span></td></tr>)}
          </tbody>
        </table>
      </div>
    </article>
  );
}
