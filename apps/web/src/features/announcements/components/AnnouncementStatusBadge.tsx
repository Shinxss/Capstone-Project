import { Archive, CalendarClock, CircleCheck, FilePenLine } from "lucide-react";

export default function AnnouncementStatusBadge({ status }: { status: string }) {
  if (status === "PUBLISHED") return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25"><CircleCheck size={12} /> Published</span>;
  if (status === "SCHEDULED") return <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-violet-700 ring-1 ring-inset ring-violet-200"><CalendarClock size={12} /> Scheduled</span>;
  if (status === "ARCHIVED") return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 ring-1 ring-inset ring-slate-200"><Archive size={12} /> Archived</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25"><FilePenLine size={12} /> Draft</span>;
}
