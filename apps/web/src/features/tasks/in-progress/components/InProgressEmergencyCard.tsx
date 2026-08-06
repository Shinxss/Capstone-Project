import { CalendarClock, ClipboardList, Eye, Map, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";
import type { InProgressPriority, InProgressTaskGroup } from "../types/inProgressTask.types";
import { formatCoordinates, formatRelativeUpdate, formatTaskDate, getEmergencyAppearance } from "../utils/inProgressTask.utils";
import DispatchProgress from "./DispatchProgress";
import EmergencyTypeIcon from "./EmergencyTypeIcon";
import InProgressResponderCard from "./InProgressResponderCard";

type Props = { group: InProgressTaskGroup; referenceTime: number; onViewDetails: (group: InProgressTaskGroup) => void };

const priorityClass: Record<InProgressPriority, string> = {
  HIGH: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/25",
  MEDIUM: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25",
  LOW: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25",
  UNSPECIFIED: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:ring-slate-600",
};

export default function InProgressEmergencyCard({ group, referenceTime, onViewDetails }: Props) {
  const emergency = group.emergency;
  const appearance = getEmergencyAppearance(emergency.emergencyType);
  const coordinates = formatCoordinates(emergency.lat, emergency.lng);
  const emergencyLabel = emergency.emergencyType ? `${emergency.emergencyType.toLocaleUpperCase()} Emergency` : "Emergency";

  return (
    <article className={`overflow-hidden rounded-2xl border border-l-4 border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-[#1C2940] dark:bg-[#0B1220] dark:hover:border-[#2A3A56] ${appearance.accent}`}>
      <div className="grid gap-5 p-4 lg:p-5 xl:grid-cols-[minmax(250px,0.9fr)_minmax(280px,1fr)_minmax(270px,1fr)_150px] xl:items-center">
        <div className="flex items-start gap-4">
          <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${appearance.surface}`}><EmergencyTypeIcon type={emergency.emergencyType} /></span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-black text-slate-950 dark:text-white">{emergencyLabel}</h2>
              <span className={`rounded-md px-2 py-1 text-[10px] font-black ring-1 ring-inset ${priorityClass[group.priority]}`}>{group.priority === "UNSPECIFIED" ? "PRIORITY —" : group.priority}</span>
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300"><MapPin size={14} className="mt-0.5 shrink-0" /><span>{emergency.barangayName ?? "Barangay unavailable"}{coordinates ? ` · (${coordinates})` : ""}</span></p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-[#162238]">ID: {emergency.referenceNumber ?? emergency.id}</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 dark:bg-[#162238]"><CalendarClock size={12} /> {formatTaskDate(group.reportedAt)}</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 dark:bg-[#162238]"><ClipboardList size={12} /> Tasks: {group.offers.length}</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 dark:bg-[#162238]"><Users size={12} /> Responders: {group.offers.length}</span>
              <span className={`rounded-md px-2 py-1 ${group.awaitingUpdate ? "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" : "bg-slate-100 dark:bg-[#162238]"}`}>{formatRelativeUpdate(group.updatedAt, referenceTime)}</span>
            </div>
          </div>
        </div>

        <DispatchProgress />

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400"><Users size={13} /> Responders ({group.offers.length})</p>
          <div className={`grid gap-2 ${group.offers.length > 1 ? "sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2" : "grid-cols-1"}`}>
            {group.offers.map((offer) => <InProgressResponderCard key={offer.id} offer={offer} />)}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <button type="button" onClick={() => onViewDetails(group)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-[#24324A] dark:text-slate-200 dark:hover:bg-[#122036]"><Eye size={15} /> View Details</button>
          <Link to={`/lgu/live-map?emergencyId=${encodeURIComponent(emergency.id)}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-3 text-xs font-bold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"><Map size={16} /> Open Live Map</Link>
        </div>
      </div>
    </article>
  );
}
