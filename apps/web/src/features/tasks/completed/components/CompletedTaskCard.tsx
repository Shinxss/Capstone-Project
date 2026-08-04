import { CalendarDays, ChevronRight, Clipboard, MapPin, ShieldCheck, UserRound } from "lucide-react";
import type { DispatchTask } from "../../models/tasks.types";
import {
  formatCoordinates,
  formatTaskDateTime,
  formatVolunteerRole,
  getInitials,
  resolveTaskAvatarUrl,
  shortenTaskId,
} from "../utils/completedTask.utils";
import EmergencyTypeBadge from "./EmergencyTypeBadge";
import VerifiedBadge from "./VerifiedBadge";

type Props = { task: DispatchTask; onViewDetails: (task: DispatchTask) => void };

export default function CompletedTaskCard({ task, onViewDetails }: Props) {
  const volunteerName = task.volunteer?.name?.trim() || "Volunteer unavailable";
  const avatarUrl = resolveTaskAvatarUrl(task.volunteer?.avatarUrl);
  const completed = formatTaskDateTime(task.completedAt);
  const verified = formatTaskDateTime(task.verifiedAt);
  const coordinates = formatCoordinates(task.emergency?.lat, task.emergency?.lng);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1C2940] dark:bg-[#0B1220]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <EmergencyTypeBadge type={task.emergency?.emergencyType} />
        <VerifiedBadge />
      </div>

      <div className="mt-4 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-[#1C2940]">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-red-50 text-sm font-bold text-red-700 ring-1 ring-red-100 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/20">
          {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : getInitials(volunteerName)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{volunteerName}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <UserRound size={13} aria-hidden="true" />
            {formatVolunteerRole(task.volunteer?.role)}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="flex gap-2 sm:col-span-2">
          <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
          <div>
            <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">Location / Barangay</dt>
            <dd className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">
              {task.emergency?.barangayName || "Barangay unavailable"}
            </dd>
            <dd className="text-xs text-slate-500 dark:text-slate-400">{coordinates ?? "Coordinates unavailable"}</dd>
          </div>
        </div>
        <div className="flex gap-2">
          <CalendarDays size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
          <div>
            <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">Completed</dt>
            <dd className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">{completed.date}</dd>
            <dd className="text-xs text-slate-500 dark:text-slate-400">{completed.time}</dd>
          </div>
        </div>
        <div className="flex gap-2">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
          <div>
            <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verified</dt>
            <dd className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">{verified.date}</dd>
            <dd className="text-xs text-slate-500 dark:text-slate-400">{verified.time}</dd>
          </div>
        </div>
      </dl>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-[#1C2940] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Clipboard size={14} aria-hidden="true" />
          <span>Task ID</span>
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-200" title={task.id}>{shortenTaskId(task.id)}</span>
        </div>
        <button
          type="button"
          onClick={() => onViewDetails(task)}
          className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-[#2A3954] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-300"
        >
          View Details
          <ChevronRight size={15} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
