import { Check, Clock3, MapPin, ShieldCheck } from "lucide-react";
import type { DispatchableResponder } from "../types/dispatchResponders.types";
import { recommendationLabelFor } from "../utils/dispatchResponder.utils";
import RecommendationBadge from "./RecommendationBadge";
import ResponderAvatar from "./ResponderAvatar";
import ResponderAvailabilityBadge from "./ResponderAvailabilityBadge";
import ResponderRating from "./ResponderRating";
import ResponderSkills from "./ResponderSkills";

function lastSeenLabel(value?: string) {
  if (!value) return "Last seen unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Last seen unavailable";
  return `Last seen ${date.toLocaleString()}`;
}

export default function ResponderCard({
  responder,
  rankedIndex,
  selected,
  onToggle,
}: {
  responder: DispatchableResponder;
  rankedIndex: number;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const recommendation = recommendationLabelFor(responder, rankedIndex);
  const disabledReason = responder.isAssigned
    ? "Already assigned to this emergency"
    : responder.availability !== "available"
      ? `Responder is ${responder.availability}`
      : "Responder cannot be dispatched to this emergency";
  return (
    <article className={`relative overflow-hidden rounded-2xl border p-4 transition ${selected ? "border-red-500 bg-red-50/50 ring-1 ring-red-500 dark:bg-red-500/5" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-[#24334D] dark:bg-[#0E1626] dark:hover:border-[#344561]"} ${responder.isDispatchable ? "" : "opacity-70"}`}>
      <RecommendationBadge label={recommendation} />
      <div className={`grid gap-4 ${recommendation ? "pt-3" : ""} sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center`}>
        <div className="flex min-w-0 gap-3">
          <ResponderAvatar name={responder.name} avatarUrl={responder.avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-bold text-slate-950 dark:text-white">{responder.name}</h3>
              <ResponderAvailabilityBadge responder={responder} />
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{responder.teamName || responder.role || "Emergency Responder"}</p>
            <div className="mt-2"><ResponderSkills skills={responder.skills} highlighted={responder.matchesEmergencyTraining} /></div>
            {Number.isFinite(responder.recommendationScore) ? (
              <p className="mt-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400" title={responder.recommendationReasons?.join(", ") || undefined}>
                Recommendation score: {responder.recommendationScore}
                {responder.recommendationReasons?.length ? ` · ${responder.recommendationReasons.join(" · ")}` : ""}
              </p>
            ) : null}
            {responder.availability === "offline" ? <p className="mt-2 text-[10px] text-slate-400">{lastSeenLabel(responder.lastSeenAt)}</p> : null}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-4 border-t border-slate-100 pt-3 dark:border-[#1E2C44] sm:grid-cols-[90px_84px_40px] sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
          <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
            <p className="flex items-center gap-1.5"><MapPin size={14} /><span className="font-semibold text-slate-700 dark:text-slate-200">{responder.distanceKm === null ? "—" : `${responder.distanceKm.toFixed(1)} km`}</span></p>
            <p className="flex items-center gap-1.5"><Clock3 size={14} /><span>{responder.etaMinutes === null ? "ETA —" : `ETA ${Math.round(responder.etaMinutes)} min`}</span></p>
          </div>
          <ResponderRating rating={responder.rating} reviewCount={responder.reviewCount} />
          <label title={responder.isDispatchable ? `Select ${responder.name}` : disabledReason} className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${selected ? "border-red-600 bg-red-600 text-white" : "border-slate-300 bg-white text-transparent dark:border-[#40506B] dark:bg-[#111C30]"} ${responder.isDispatchable ? "cursor-pointer hover:border-red-400" : "cursor-not-allowed opacity-60"}`}>
            <input type="checkbox" checked={selected} onChange={() => onToggle(responder.id)} disabled={!responder.isDispatchable} className="sr-only" aria-label={`${selected ? "Deselect" : "Select"} ${responder.name}`} />
            <Check size={17} strokeWidth={3} aria-hidden="true" />
          </label>
        </div>
      </div>
      {responder.isAssigned ? <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300"><ShieldCheck size={14} />This responder already has an active assignment for this emergency.</p> : null}
    </article>
  );
}
