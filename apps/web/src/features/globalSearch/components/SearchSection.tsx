import { ArrowRight } from "lucide-react";
import { getSearchCategoryDefinition } from "../constants/search.constants";
import type { SearchCategoryGroup, SearchResultItem } from "../models/globalSearch.types";
import EmergencySearchResultCard from "./EmergencySearchResultCard";
import GenericSearchResultCard from "./GenericSearchResultCard";
import VolunteerSearchResultCard from "./VolunteerSearchResultCard";
import TaskSearchResultCard from "./TaskSearchResultCard";

type Props = {
  group: SearchCategoryGroup;
  onViewAll: () => void;
  onOpenItem: (item: SearchResultItem) => void;
};

export default function SearchSection({ group, onViewAll, onOpenItem }: Props) {
  const definition = getSearchCategoryDefinition(group.category);
  const Icon = definition.icon;

  return (
    <section className="overflow-hidden rounded-[14px] border border-slate-200 bg-slate-50/50 shadow-[0_1px_3px_rgba(15,23,42,0.025)] dark:border-[#213451] dark:bg-[#0A1220]">
      <header className="flex min-h-11 items-center justify-between gap-3 border-b border-slate-200 px-4 py-2 dark:border-[#213451]">
        <div className="flex items-center gap-2.5">
          <Icon size={21} className={group.category === "EMERGENCY" ? "text-red-600 dark:text-red-400" : group.category === "VOLUNTEER" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"} />
          <h2 className="text-[18px] font-bold text-slate-950 dark:text-white">
            {definition.sectionLabel} <span className="font-semibold text-slate-500 dark:text-slate-400">({group.items.length})</span>
          </h2>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="hidden items-center gap-1.5 text-[13px] font-semibold text-blue-600 transition hover:text-blue-700 hover:underline sm:inline-flex dark:text-blue-400 dark:hover:text-blue-300"
        >
          View all {definition.label.toLowerCase()} <ArrowRight size={15} />
        </button>
      </header>

      <div className="space-y-1.5 p-2.5">
        {group.items.map((item) => {
          if (item.category === "VOLUNTEER") {
            return <VolunteerSearchResultCard key={item.id} item={item} onOpen={() => onOpenItem(item)} />;
          }
          if (item.category === "EMERGENCY") {
            return <EmergencySearchResultCard key={item.id} item={item} onOpen={() => onOpenItem(item)} />;
          }
          if (item.category === "TASK") {
            return <TaskSearchResultCard key={item.id} item={item} onOpen={() => onOpenItem(item)} />;
          }
          return <GenericSearchResultCard key={item.id} item={item} onOpen={() => onOpenItem(item)} />;
        })}
      </div>
    </section>
  );
}
