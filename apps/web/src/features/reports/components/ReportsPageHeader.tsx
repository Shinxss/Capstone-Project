import { FileText } from "lucide-react";
import type { ComponentProps } from "react";
import ReportsFilters from "./ReportsFilters";

type Props = ComponentProps<typeof ReportsFilters> & { barangayName: string };

export default function ReportsPageHeader({ barangayName, ...filterProps }: Props) {
  return (
    <section className="flex w-full min-w-0 max-w-full flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600 shadow-sm dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          <FileText size={23} strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold leading-tight text-slate-950 dark:text-slate-100">Reports &amp; Analytics</h1>
          <p className="mt-0.5 text-sm font-medium leading-tight text-slate-500 dark:text-slate-400">{barangayName} Overview</p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Track emergency response, volunteer performance, and community safety in your barangay.</p>
        </div>
      </div>
      <ReportsFilters {...filterProps} />
    </section>
  );
}
