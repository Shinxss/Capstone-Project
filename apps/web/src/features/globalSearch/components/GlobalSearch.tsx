import React from "react";
import {
  Search,
  X,
  History,
  Siren,
  ShieldCheck,
  Users,
  ClipboardList,
  MapPin,
  FileText,
  Compass,
  Loader2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useGlobalSearch } from "../hooks/useGlobalSearch";
import type {
  SearchResultBadgeTone,
  SearchResultItem,
} from "../models/globalSearch.types";

type GlobalSearchProps = {
  portalPathPrefix?: string;
};

function CategoryGroupIcon({
  type,
  className = "h-4 w-4",
}: {
  type: SearchResultItem["iconType"];
  className?: string;
}) {
  switch (type) {
    case "emergency":
      return <Siren className={`${className} text-red-600 dark:text-blue-400`} />;
    case "responder":
      return <ShieldCheck className={`${className} text-red-600 dark:text-blue-400`} />;
    case "volunteer":
      return <Users className={`${className} text-red-600 dark:text-blue-400`} />;
    case "task":
      return <ClipboardList className={`${className} text-red-600 dark:text-blue-400`} />;
    case "location":
      return <MapPin className={`${className} text-red-600 dark:text-blue-400`} />;
    case "report":
      return <FileText className={`${className} text-red-600 dark:text-blue-400`} />;
    case "navigation":
    default:
      return <Compass className={`${className} text-red-600 dark:text-blue-400`} />;
  }
}

function ResultBadge({ label, tone }: { label: string; tone: SearchResultBadgeTone }) {
  const toneClasses: Record<SearchResultBadgeTone, string> = {
    red: "bg-red-100 text-red-700 border-red-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/25",
    emerald: "bg-red-50 text-red-700 border-red-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/25",
    blue: "bg-red-100 text-red-700 border-red-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/25",
    amber: "bg-red-50 text-red-800 border-red-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/25",
    purple: "bg-red-100 text-red-700 border-red-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/25",
    gray: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-[#122036] dark:text-slate-300 dark:border-[#21375d]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}

export default function GlobalSearch({ portalPathPrefix = "/lgu" }: GlobalSearchProps) {
  const {
    isOpen,
    openSearch,
    closeSearch,
    query,
    setQuery,
    debouncedQuery,
    isSearching,
    flatResults,
    groupedResults,
    selectedIndex,
    setSelectedIndex,
    selectItem,
    recentSearches,
    removeRecentSearch,
    clearRecentSearches,
    navigateToFullSearch,
    containerRef,
    inputRef,
    handleKeyDown,
  } = useGlobalSearch({ portalPathPrefix, debounceMs: 200 });

  // Map each item in flatResults to its global index for keyboard selection
  const itemIndexMap = React.useMemo(() => {
    const map = new Map<string, number>();
    flatResults.forEach((item, idx) => {
      map.set(item.id, idx);
    });
    return map;
  }, [flatResults]);

  const hasTyped = query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-180 mx-auto">
      {/* ── Normal Global Search Input in Dashboard Header ── */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 pointer-events-none"
        />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={openSearch}
          onKeyDown={handleKeyDown}
          placeholder="Search emergencies, responders, volunteers, tasks..."
          className="w-full h-11 rounded-lg border border-gray-300 bg-white pl-12 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
          aria-label="Global Search"
          aria-expanded={isOpen}
          autoComplete="off"
          spellCheck="false"
        />

        {/* Right Input Controls */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {isSearching ? (
            <Loader2
              size={16}
              className="animate-spin text-red-600 dark:text-blue-400 mr-1"
            />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                closeSearch();
                inputRef.current?.focus();
              }}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-400 dark:hover:bg-[#122036] dark:hover:text-slate-200"
              aria-label="Clear search text"
            >
              <X size={15} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 dark:border-[#1e3258] dark:bg-[#122036] dark:text-slate-400">
              Ctrl K
            </kbd>
          )}
        </div>
      </div>

      {/* ── Anchored Dropdown Panel (Directly underneath) ── */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-[#162544] dark:bg-[#0E1626] dark:shadow-2xl"
          style={{ maxHeight: "min(440px, calc(100vh - 84px))" }}
          role="listbox"
        >
          {/* STATE 1: User hasn't typed anything yet -> Show Recent Searches (YouTube / FB style) */}
          {!hasTyped ? (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-500 dark:text-slate-400 border-b border-gray-100 dark:border-[#162544]">
                <div className="flex items-center gap-2">
                  <History size={14} className="text-gray-400 dark:text-slate-400" />
                  <span>Recent searches</span>
                </div>
                {recentSearches.length > 0 && (
                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="text-[11px] font-semibold text-red-600 hover:underline dark:text-blue-400"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {recentSearches.length === 0 ? (
                <div className="py-6 px-4 text-center">
                  <div className="text-xs text-gray-400 dark:text-slate-500">
                    No recent searches yet. Type to search emergencies, responders, and tasks.
                  </div>
                </div>
              ) : (
                <div className="py-1 space-y-0.5 max-h-[300px] overflow-y-auto">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      onClick={() => {
                        setQuery(term);
                        navigateToFullSearch(term);
                      }}
                      className="group flex items-center justify-between rounded-lg px-3 py-2 text-left transition cursor-pointer hover:bg-red-50/60 dark:hover:bg-[#122036]"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <History
                          size={15}
                          className="shrink-0 text-gray-400 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-blue-400 transition"
                        />
                        <span className="truncate text-sm font-medium text-gray-800 dark:text-slate-200">
                          {term}
                        </span>
                      </div>

                      {/* X Delete button on the right (like YouTube / FB) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch(term);
                        }}
                        className="rounded-md p-1 text-gray-400 hover:bg-gray-200/60 hover:text-gray-600 dark:text-slate-400 dark:hover:bg-[#1B2A45] dark:hover:text-slate-200 transition"
                        aria-label={`Remove ${term} from recent searches`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* STATE 2: User has typed characters -> Show Live Grouped Results */
            <div className="overflow-y-auto max-h-[min(440px,calc(100vh-84px))] p-2 divide-y divide-gray-100 dark:divide-[#162544]/60">
              {groupedResults.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="mt-2.5 text-sm font-bold text-gray-900 dark:text-slate-100">
                    No results found
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    No matches found for &ldquo;{debouncedQuery || query}&rdquo;. Press Enter to search anyway.
                  </div>
                </div>
              ) : (
                groupedResults.map((group) => (
                  <div key={group.category} className="py-2 first:pt-1 last:pb-1">
                    {/* Category Section Header */}
                    <div className="flex items-center justify-between px-3 py-1.5 mb-1 text-xs font-bold text-gray-500 dark:text-slate-400">
                      <div className="flex items-center gap-2 uppercase tracking-wider text-[11px]">
                        <CategoryGroupIcon type={group.iconType} className="h-3.5 w-3.5" />
                        <span>{group.label}</span>
                        <span className="rounded-full bg-gray-100 px-1.5 py-0.2 text-[10px] font-semibold text-gray-600 dark:bg-[#122036] dark:text-slate-300">
                          {group.items.length}
                        </span>
                      </div>
                    </div>

                    {/* Group Items */}
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const itemIdx = itemIndexMap.get(item.id) ?? -1;
                        const isSelected = itemIdx === selectedIndex;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => selectItem(item)}
                            onMouseEnter={() => {
                              if (itemIdx >= 0) setSelectedIndex(itemIdx);
                            }}
                            className={[
                              "w-full flex items-center justify-between rounded-lg px-3 py-2 text-left transition group",
                              isSelected
                                ? "bg-red-50/80 border-l-4 border-l-red-600 pl-2 dark:bg-[#122036] dark:border-l-blue-500"
                                : "hover:bg-red-50/50 border-l-4 border-l-transparent pl-2 dark:hover:bg-[#122036]/70",
                            ].join(" ")}
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                              <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 border border-gray-200 dark:bg-[#0B1220] dark:border-[#162544]">
                                <CategoryGroupIcon type={item.iconType} className="h-4 w-4" />
                              </div>

                              <div className="min-w-0 leading-tight">
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-sm font-semibold text-gray-900 dark:text-slate-100">
                                    {item.title}
                                  </span>
                                  {item.badge && (
                                    <ResultBadge
                                      label={item.badge.label}
                                      tone={item.badge.tone}
                                    />
                                  )}
                                </div>

                                <div className="mt-0.5 truncate text-xs text-gray-500 dark:text-slate-400">
                                  {item.subtitle}
                                </div>
                              </div>
                            </div>

                            {/* Quick Jump indicator */}
                            <div className="shrink-0 flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-blue-400">
                                  Jump to <ArrowRight size={12} />
                                </span>
                              ) : (
                                <ExternalLink
                                  size={12}
                                  className="opacity-0 group-hover:opacity-100 text-gray-400 dark:text-slate-400 transition"
                                />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Compact Dropdown Footer with Navigation Hints */}
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/80 px-4 py-2 text-[11px] text-gray-500 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-400">
            <span>
              {hasTyped ? (
                <>Press <kbd className="font-mono font-semibold">Enter ↵</kbd> for full results</>
              ) : (
                "Search Lifeline"
              )}
            </span>

            <div className="flex items-center gap-2.5">
              <span>
                <kbd className="rounded border border-gray-200 bg-white px-1 py-0.5 font-mono text-[9px] dark:border-[#162544] dark:bg-[#0E1626]">
                  &uarr;&darr;
                </kbd>{" "}
                navigate
              </span>
              <span>
                <kbd className="rounded border border-gray-200 bg-white px-1 py-0.5 font-mono text-[9px] dark:border-[#162544] dark:bg-[#0E1626]">
                  esc
                </kbd>{" "}
                close
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
