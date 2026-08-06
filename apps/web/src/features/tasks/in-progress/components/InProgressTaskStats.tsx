import { Clock3, Route, Siren, TimerReset } from "lucide-react";
import type { InProgressTaskStatistics } from "../types/inProgressTask.types";

type Props = { stats: InProgressTaskStatistics };

const cardClass = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1C2940] dark:bg-[#0B1220]";

export default function InProgressTaskStats({ stats }: Props) {
  const items = [
    { label: "Active Emergencies", value: String(stats.activeEmergencies), support: "Accepted dispatch groups", icon: Siren, iconClass: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300" },
    { label: "Responders En Route", value: String(stats.respondersEnRoute), support: "Across active emergencies", icon: Route, iconClass: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300" },
    { label: "Awaiting Update", value: String(stats.awaitingUpdate), support: "No update for 15+ minutes", icon: Clock3, iconClass: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300" },
    { label: "Avg Arrival Time", value: stats.averageArrivalTimeMs === null ? "—" : `${Math.round(stats.averageArrivalTimeMs / 60_000)} min`, support: stats.averageArrivalTimeMs === null ? "Arrival timestamps unavailable" : "For current dispatches", icon: TimerReset, iconClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" },
  ];

  return (
    <section aria-label="In-progress task statistics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article key={item.label} className={cardClass}>
          <div className="flex items-center gap-4">
            <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${item.iconClass}`}><item.icon size={24} aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{item.label}</p>
              <p className="mt-0.5 text-2xl font-black text-slate-950 dark:text-white">{item.value}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{item.support}</p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
