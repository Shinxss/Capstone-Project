import { Mail, Phone, UserRound } from "lucide-react";
import type { EmergencyApprovalItem } from "../models/approvals.types";
import { formatApprovalRole } from "../utils/approval.utils";

export default function ReporterInfoCard({ item }: { item: EmergencyApprovalItem }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="flex items-center gap-3 text-base font-bold text-slate-950"><UserRound size={19} /> Reporter Information</h2>
      <div className="mt-4 space-y-2.5 text-sm text-slate-700">
        <div className="flex items-center gap-3">
          <UserRound size={16} className="shrink-0 text-slate-800" />
          <span className="font-semibold text-slate-900">{item.reporter.name}</span>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-600">
            {formatApprovalRole(item.reporter.role, item.reporter.isGuest)}
          </span>
        </div>
        {item.reporter.phone ? <div className="flex items-center gap-3"><Phone size={16} className="shrink-0" /><span>{item.reporter.phone}</span></div> : null}
        {item.reporter.email ? <div className="flex items-center gap-3"><Mail size={16} className="shrink-0" /><span className="break-all">{item.reporter.email}</span></div> : null}
      </div>
    </section>
  );
}
