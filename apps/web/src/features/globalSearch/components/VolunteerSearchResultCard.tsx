import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Star,
} from "lucide-react";
import type { SearchResultItem } from "../models/globalSearch.types";
import SearchResultBadge from "./SearchResultBadge";

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "V";
}

function VolunteerAvatar({ item }: { item: SearchResultItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const active = ["available", "active"].includes(
    String(item.details?.availability ?? "").toLowerCase()
  );

  return (
    <div className="relative h-15 w-15 shrink-0 sm:h-16 sm:w-16">
      {item.details?.avatarUrl && !imageFailed ? (
        <img
          src={item.details.avatarUrl}
          alt=""
          onError={() => setImageFailed(true)}
          className="h-full w-full rounded-full border border-slate-200 object-cover dark:border-[#29405F]"
        />
      ) : (
        <div className="grid h-full w-full place-items-center rounded-full bg-cyan-50 text-xl font-bold text-slate-900 ring-1 ring-inset ring-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-100 dark:ring-cyan-400/15">
          {initialsFor(item.title)}
        </div>
      )}
      {active ? (
        <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-[#0E1626]" />
      ) : null}
    </div>
  );
}

export default function VolunteerSearchResultCard({
  item,
  onOpen,
}: {
  item: SearchResultItem;
  onOpen: () => void;
}) {
  const details = item.details;
  const verified = String(item.rawStatus ?? item.badge?.label ?? "").toLowerCase() === "verified";
  const hasMetrics = details?.completedTasks !== undefined || details?.rating !== undefined;

  return (
    <article
      onClick={onOpen}
      className="group rounded-xl border border-slate-200/90 bg-white p-3.5 transition hover:border-red-200 hover:shadow-[0_1px_3px_rgba(15,23,42,0.04)] dark:border-[#213451] dark:bg-[#0E1626] dark:hover:border-red-500/30"
    >
      <div className="flex cursor-pointer flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <VolunteerAvatar item={item} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[17px] font-semibold text-slate-950 transition group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">
                {item.title}
              </h3>
              {verified ? <BadgeCheck size={18} className="fill-emerald-600 text-white dark:text-[#0E1626]" /> : null}
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase leading-4 tracking-wide text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
                {details?.roleLabel || "Volunteer"}
              </span>
              {item.badge ? <SearchResultBadge {...item.badge} /> : null}
            </div>

            <p className="mt-1 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
              {item.subtitle}
            </p>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-slate-600 dark:text-slate-400">
              {details?.phone ? (
                <span className="inline-flex items-center gap-1.5"><Phone size={14} className="text-slate-800 dark:text-slate-300" />{details.phone}</span>
              ) : null}
              {details?.email ? (
                <span className="inline-flex min-w-0 items-center gap-1.5"><Mail size={14} className="shrink-0 text-slate-800 dark:text-slate-300" /><span className="truncate">{details.email}</span></span>
              ) : null}
              {details?.location ? (
                <span className="inline-flex min-w-0 items-center gap-1.5"><MapPin size={14} className="shrink-0 text-slate-800 dark:text-slate-300" /><span className="truncate">{details.location}</span></span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0 dark:border-[#213451]">
          {hasMetrics ? (
            <div className="flex items-stretch divide-x divide-slate-200 dark:divide-[#29405F]">
              {details?.completedTasks !== undefined ? (
                <div className="min-w-26 px-4 first:pl-0 xl:first:pl-4">
                  <div className="flex items-center gap-1.5 text-base font-bold text-slate-950 dark:text-white"><CheckCircle2 size={16} />{details.completedTasks}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Tasks completed</div>
                </div>
              ) : null}
              {details?.rating !== undefined ? (
                <div className="min-w-22 px-4">
                  <div className="flex items-center gap-1.5 text-base font-bold text-slate-950 dark:text-white"><Star size={16} className="fill-slate-900 dark:fill-white" />{details.rating.toFixed(1)}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Rating</div>
                </div>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onOpen(); }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[9px] bg-red-600 px-5 text-[13px] font-semibold text-white transition hover:bg-red-700 sm:ml-auto sm:w-auto"
          >
            View Volunteer <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
