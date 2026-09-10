import { ArrowRight, ExternalLink, MapPin } from "lucide-react";
import { getSearchCategoryDefinition } from "../constants/search.constants";
import type { SearchResultItem } from "../models/globalSearch.types";
import SearchResultBadge from "./SearchResultBadge";

const actionLabels: Record<SearchResultItem["iconType"], string> = {
  emergency: "View on Map",
  responder: "View Profile",
  volunteer: "View Volunteer",
  task: "View Task",
  location: "Explore Map",
  report: "Open Report",
  navigation: "Go to Page",
};

export default function GenericSearchResultCard({
  item,
  onOpen,
}: {
  item: SearchResultItem;
  onOpen: () => void;
}) {
  const definition = getSearchCategoryDefinition(item.category);
  const Icon = definition.icon;

  return (
    <article
      onClick={onOpen}
      className="group flex cursor-pointer flex-col gap-3.5 rounded-xl border border-slate-200/90 bg-white p-3.5 transition hover:border-red-200 hover:shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center dark:border-[#213451] dark:bg-[#0E1626] dark:hover:border-red-500/30"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-slate-200 bg-slate-50 text-slate-700 dark:border-[#29405F] dark:bg-[#17243A] dark:text-slate-300">
          <Icon size={19} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-950 transition group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">{item.title}</h3>
            {item.badge ? <SearchResultBadge {...item.badge} /> : null}
          </div>
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[13px] text-slate-600 dark:text-slate-400">
            {item.coordinates ? <MapPin size={14} className="shrink-0 text-red-600 dark:text-red-400" /> : null}
            <span className="truncate">{item.subtitle}</span>
          </p>
          {item.meta ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{item.meta}</p> : null}
        </div>
      </div>
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); onOpen(); }}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[9px] bg-red-600 px-5 text-[13px] font-semibold text-white transition hover:bg-red-700 sm:w-auto"
      >
        {actionLabels[item.iconType]}
        {item.external ? <ExternalLink size={15} /> : <ArrowRight size={15} />}
      </button>
    </article>
  );
}
