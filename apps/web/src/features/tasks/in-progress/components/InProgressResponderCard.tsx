import { Clock3, Navigation } from "lucide-react";
import type { DispatchTask } from "../../models/tasks.types";
import { getInitials } from "../utils/inProgressTask.utils";
import { resolveTaskAvatarUrl } from "../../completed/utils/completedTask.utils";

type Props = { offer: DispatchTask };

export default function InProgressResponderCard({ offer }: Props) {
  const volunteer = offer.volunteer;
  const avatarUrl = resolveTaskAvatarUrl(volunteer?.avatarUrl);
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-[#24324A] dark:bg-[#0E1626]">
      <div className="flex items-center gap-3">
        <div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-700">
          {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : <span className="grid size-full place-items-center text-xs font-black text-slate-600 dark:text-slate-200">{getInitials(volunteer?.name)}</span>}
          <span className="absolute bottom-0.5 right-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-[#0E1626]" aria-label="En route" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{volunteer?.name ?? "Assigned volunteer"}</p>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">En Route</span>
          </div>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{volunteer?.role ?? "Volunteer"}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1"><Navigation size={12} /> Location {offer.lastKnownLocation ? "available" : "unavailable"}</span>
        <span className="inline-flex items-center gap-1"><Clock3 size={12} /> ETA —</span>
      </div>
    </article>
  );
}
