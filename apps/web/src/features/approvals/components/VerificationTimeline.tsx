import { History } from "lucide-react";
import type { EmergencyApprovalItem } from "../models/approvals.types";
import { formatApprovalDate } from "../utils/approval.utils";

export default function VerificationTimeline({ item }: { item: EmergencyApprovalItem }) {
  const decided = item.status === "approved" || item.status === "rejected";
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-[#1C2940] dark:bg-[#0B1220]">
      <h2 className="flex items-center gap-3 text-base font-bold text-slate-950 dark:text-white"><History size={19} /> Activity Log</h2>
      <div className="relative mt-4 space-y-5 pl-8 before:absolute before:bottom-3 before:left-[7px] before:top-2 before:w-px before:bg-slate-200 dark:before:bg-[#293852]">
        <div className="relative">
          <span className="absolute -left-8 top-1 h-3.5 w-3.5 rounded-full bg-red-600 ring-4 ring-red-50 dark:ring-red-500/15" />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Report Submitted</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{formatApprovalDate(item.reportedAt || item.createdAt)}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Report created by {item.reporter.name}</p>
        </div>

        {item.status === "pending" ? (
          <div className="relative">
            <span className="absolute -left-8 top-1 h-3.5 w-3.5 rounded-full bg-amber-500 ring-4 ring-amber-50 dark:ring-amber-500/15" />
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Under Review</h3>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">Current</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Awaiting an LGU verification decision</p>
          </div>
        ) : null}

        {decided ? (
          <div className="relative">
            <span className={`absolute -left-8 top-1 h-3.5 w-3.5 rounded-full ring-4 ${item.status === "approved" ? "bg-emerald-600 ring-emerald-50 dark:ring-emerald-500/15" : "bg-red-600 ring-red-50 dark:ring-red-500/15"}`} />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Report {item.status === "approved" ? "Approved" : "Rejected"}</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">{formatApprovalDate(item.reviewedAt || item.updatedAt)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Final verification decision recorded</p>
            {item.status === "rejected" && item.rejectionReason ? <p className="mt-1 text-xs text-red-600 dark:text-red-300">Reason: {item.rejectionReason}</p> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
