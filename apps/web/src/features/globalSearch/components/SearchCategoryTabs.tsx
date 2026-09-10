import { ChevronsUpDown } from "lucide-react";
import { SEARCH_CATEGORIES } from "../constants/search.constants";
import type { SearchCategory, SearchCategoryCount } from "../models/globalSearch.types";

type Props = {
  selectedCategory: SearchCategory;
  counts: SearchCategoryCount;
  onSelect: (category: SearchCategory) => void;
};

export default function SearchCategoryTabs({ selectedCategory, counts, onSelect }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="search-tabs-scroll flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-0.5">
        {SEARCH_CATEGORIES.map((category) => {
          const active = category.key === selectedCategory;
          const Icon = category.icon;
          return (
            <button
              key={category.key}
              type="button"
              onClick={() => onSelect(category.key)}
              aria-pressed={active}
              className={[
                "inline-flex h-10 shrink-0 items-center gap-2 rounded-[10px] border px-3.5 text-[13px] font-semibold transition",
                active
                  ? "border-red-600 bg-red-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50/50 dark:border-[#213451] dark:bg-[#0E1626] dark:text-slate-300 dark:hover:border-red-500/30 dark:hover:bg-red-500/5",
              ].join(" ")}
            >
              <Icon size={17} />
              <span>{category.label}</span>
              <span
                className={[
                  "inline-flex min-w-4.5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  active
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600 dark:bg-[#1A2941] dark:text-slate-300",
                ].join(" ")}
              >
                {counts[category.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 lg:pl-4">
        <span className="whitespace-nowrap text-[13px] text-slate-500 dark:text-slate-400">Sort by</span>
        <label className="relative">
          <span className="sr-only">Sort search results</span>
          <select
            value="relevance"
            onChange={() => undefined}
            className="h-10 w-40 appearance-none rounded-[10px] border border-slate-200 bg-white pl-10 pr-9 text-[13px] font-semibold text-slate-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-[#213451] dark:bg-[#0E1626] dark:text-slate-200 dark:focus:ring-red-500/10"
          >
            <option value="relevance">Relevance</option>
          </select>
          <ChevronsUpDown
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400"
          />
        </label>
      </div>
    </div>
  );
}
