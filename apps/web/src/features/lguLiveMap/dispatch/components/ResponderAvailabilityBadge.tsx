import { Circle } from "lucide-react";
import type { DispatchableResponder } from "../types/dispatchResponders.types";

export default function ResponderAvailabilityBadge({ responder }: { responder: DispatchableResponder }) {
  if (responder.isAssigned) {
    return <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"><Circle size={7} fill="currentColor" />Assigned</span>;
  }
  const styles = {
    available: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    busy: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    idle: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300",
    offline: "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-400",
  };
  const labels = { available: "Available", busy: "Busy", idle: "Unavailable", offline: "Offline" };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${styles[responder.availability]}`}><Circle size={7} fill="currentColor" />{labels[responder.availability]}</span>;
}
