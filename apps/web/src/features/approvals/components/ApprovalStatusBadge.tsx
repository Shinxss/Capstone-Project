import type { EmergencyApprovalStatus } from "../models/approvals.types";

const styles: Record<EmergencyApprovalStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  not_required: "border-slate-200 bg-slate-50 text-slate-600",
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
