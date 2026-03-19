import { CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import type { ForReviewChecklistItem } from "../hooks/useLguTasksForReview";

type Props = {
  items: ForReviewChecklistItem[];
};

function StatusIcon({ status }: { status: ForReviewChecklistItem["status"] }) {
  if (status === "pass") {
    return <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />;
  }
  if (status === "fail") {
    return <XCircle size={16} className="text-red-600 dark:text-red-400" aria-hidden="true" />;
  }
  return <HelpCircle size={16} className="text-gray-500 dark:text-slate-400" aria-hidden="true" />;
}

export default function ForReviewChecklist({ items }: Props) {
  return (
    <section className="border-b border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
      <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Verification Checklist</h3>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-2 bg-gray-50 px-3 py-2 dark:bg-[#0E1626]">
            <StatusIcon status={item.status} />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{item.label}</div>
              <div className="text-xs text-gray-600 dark:text-slate-400">{item.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
