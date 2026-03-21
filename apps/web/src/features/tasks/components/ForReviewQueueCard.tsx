import { Clock3, MapPin, Paperclip } from "lucide-react";
import type { ForReviewQueueItem } from "../hooks/useLguTasksForReview";
import ForReviewVolunteerAvatar from "./ForReviewVolunteerAvatar";

type Props = {
  item: ForReviewQueueItem;
  selected: boolean;
  verifying: boolean;
  onSelect: () => void;
};

export default function ForReviewQueueCard({ item, selected, verifying, onSelect }: Props) {
  const statusLabel = item.missingProof ? "Missing proof" : item.severity;
  const hasAttentionTone = item.missingProof || item.severity === "High";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        "w-full rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50",
        selected
          ? "border-red-300 bg-red-50/70 shadow-sm dark:border-red-500/40 dark:bg-red-500/10"
          : hasAttentionTone
            ? "border-amber-200 bg-amber-50/35 hover:border-amber-300 hover:bg-amber-50/55 dark:border-amber-900/35 dark:bg-amber-950/15 dark:hover:border-amber-800/45 dark:hover:bg-amber-950/25"
            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0B1220] dark:hover:border-[#22365D] dark:hover:bg-[#0E1626]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
            <ForReviewVolunteerAvatar name={item.volunteerName} avatarUrl={item.volunteerAvatarUrl} size="sm" />
            <span className="truncate text-sm text-gray-800 dark:text-slate-200">{item.volunteerName}</span>
          </div>
          <div className="mt-1 text-sm font-bold text-gray-900 dark:text-slate-100">{item.emergencyType}</div>
          <span
            className={[
              "mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              item.missingProof
                ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-200"
                : item.severity === "High"
                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
                  : "border-gray-200 bg-gray-50 text-gray-700 dark:border-[#2A3D63] dark:bg-[#101A30] dark:text-slate-200",
            ].join(" ")}
          >
            {statusLabel}
          </span>
        </div>

        <span
          className={[
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            verifying
              ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200"
              : "border-gray-200 bg-white text-gray-700 dark:border-[#2A3D63] dark:bg-[#101A30] dark:text-slate-200",
          ].join(" ")}
        >
          {verifying ? "Verifying..." : "Awaiting Review"}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-600 dark:text-slate-400">
        <div className="inline-flex items-center gap-1.5">
          <MapPin size={12} />
          <span className="truncate">{item.barangay}</span>
        </div>
        <div className="inline-flex items-center justify-end gap-1.5 text-right">
          <Paperclip size={12} />
          <span>{item.proofCount} proof{item.proofCount === 1 ? "" : "s"}</span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <Clock3 size={12} />
          <span className="truncate">{item.submittedAtLabel}</span>
        </div>
      </div>
    </button>
  );
}
