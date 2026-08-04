import { useState } from "react";
import { CalendarDays, Check, ChevronRight, Clipboard, MapPin, ShieldCheck } from "lucide-react";
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

function TaskId({ taskId }: { taskId: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(taskId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className="truncate font-mono text-xs font-semibold text-slate-700 dark:text-slate-200" title={taskId}>
        {shortenTaskId(taskId)}
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={copied ? "Task ID copied" : `Copy task ID ${taskId}`}
        title={copied ? "Copied" : "Copy task ID"}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-[#17243A] dark:hover:text-slate-200"
      >
        {copied ? <Check size={14} className="text-emerald-600" /> : <Clipboard size={14} />}
      </button>
    </div>
  );
}

function Volunteer({ task }: { task: DispatchTask }) {
  const avatarUrl = resolveTaskAvatarUrl(task.volunteer?.avatarUrl);
  const name = task.volunteer?.name?.trim() || "Volunteer unavailable";
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-red-50 text-xs font-bold text-red-700 ring-1 ring-red-100 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/20">
        {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : getInitials(name)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100" title={name}>{name}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{formatVolunteerRole(task.volunteer?.role)}</p>
      </div>
    </div>
  );
}

function Location({ task }: { task: DispatchTask }) {
  const coordinates = formatCoordinates(task.emergency?.lat, task.emergency?.lng);
  return (
    <div className="flex min-w-0 gap-2">
      <MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200" title={task.emergency?.barangayName ?? undefined}>
          {task.emergency?.barangayName || "Barangay unavailable"}
        </p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{coordinates ?? "Coordinates unavailable"}</p>
      </div>
    </div>
  );
}

function DateTime({ value, verified = false }: { value?: string | null; verified?: boolean }) {
  const formatted = formatTaskDateTime(value);
  const Icon = verified ? ShieldCheck : CalendarDays;
  return (
    <div className="flex gap-2">
      <Icon size={15} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
      <time dateTime={formatted.dateTime} className="min-w-0">
        <span className="block text-xs font-medium text-slate-800 dark:text-slate-200">{formatted.date}</span>
        <span className="block text-[11px] text-slate-500 dark:text-slate-400">{formatted.time}</span>
      </time>
    </div>
  );
}

export default function CompletedTaskRow({ task, onViewDetails }: Props) {
  return (
    <tr className="group border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/80 dark:border-[#18253A] dark:hover:bg-[#0F192B]">
      <td className="px-3 py-4"><TaskId taskId={task.id} /></td>
      <td className="px-3 py-4"><EmergencyTypeBadge type={task.emergency?.emergencyType} /></td>
      <td className="px-3 py-4"><Volunteer task={task} /></td>
      <td className="px-3 py-4"><Location task={task} /></td>
      <td className="px-3 py-4"><DateTime value={task.completedAt} /></td>
      <td className="px-3 py-4"><DateTime value={task.verifiedAt} verified /></td>
      <td className="px-3 py-4"><VerifiedBadge /></td>
      <td className="px-3 py-4 text-right">
        <button
          type="button"
          onClick={() => onViewDetails(task)}
          className="inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-[#2A3954] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-300"
        >
          View Details
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}
