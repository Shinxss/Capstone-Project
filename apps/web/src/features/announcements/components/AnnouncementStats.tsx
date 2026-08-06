import { CalendarClock, Megaphone, PencilLine, Send } from "lucide-react";
import type { AnnouncementStatistics } from "../models/announcements.types";

export default function AnnouncementStats({ statistics }: { statistics: AnnouncementStatistics }) {
  const cards = [
    { label: "Total Announcements", value: statistics.total, support: "All time", icon: Megaphone, style: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300" },
    { label: "Published", value: statistics.published, support: "Live and visible", icon: Send, style: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" },
    { label: "Drafts", value: statistics.drafts, support: "Not yet published", icon: PencilLine, style: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300" },
    { label: "Scheduled", value: statistics.scheduled ?? "—", support: statistics.scheduled === null ? "Scheduling unavailable" : "Upcoming announcements", icon: CalendarClock, style: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300" },
  ];
  return (
    <section aria-label="Announcement statistics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1C2940] dark:bg-[#0B1220]"><div className="flex items-center gap-4"><span className={`grid size-14 shrink-0 place-items-center rounded-full ${card.style}`}><card.icon size={25} /></span><div><p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{card.label}</p><p className="mt-0.5 text-2xl font-black text-slate-950 dark:text-white">{card.value}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.support}</p></div></div></article>)}
    </section>
  );
}
