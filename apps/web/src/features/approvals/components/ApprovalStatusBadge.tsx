import type { EmergencyApprovalStatus } from "../models/approvals.types";

const styles: Record<EmergencyApprovalStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-300",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/35 dark:bg-red-500/15 dark:text-red-300",
  not_required: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-700/30 dark:text-slate-300",
};

const labels: Record<EmergencyApprovalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  not_required: "Not Required",
};

export default function ApprovalStatusBadge({ status }: { status: EmergencyApprovalStatus }) {
  return (
    <span className={`inline-flex rounded-md border px-2.5 py-1 text-[11px] font-bold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
