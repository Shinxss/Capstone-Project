import type { SearchResultBadgeTone } from "../models/globalSearch.types";

const toneClasses: Record<SearchResultBadgeTone, string> = {
  red: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
  blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300",
  amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300",
  purple: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/25 dark:bg-purple-500/10 dark:text-purple-300",
  gray: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600/40 dark:bg-slate-700/30 dark:text-slate-300",
};

export default function SearchResultBadge({
  label,
  tone,
}: {
  label: string;
  tone: SearchResultBadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase leading-4 tracking-wide ${toneClasses[tone]}`}
    >
      {label.replaceAll("_", " ")}
    </span>
  );
}
