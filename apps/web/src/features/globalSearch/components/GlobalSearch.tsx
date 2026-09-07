import { useEffect, useRef } from "react";
import {
  Search,
  X,
  Siren,
  ShieldCheck,
  Users,
  ClipboardList,
  MapPin,
  Compass,
  CornerDownLeft,
  Loader2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useGlobalSearch } from "../hooks/useGlobalSearch";
import type {
  SearchCategory,
  SearchResultBadgeTone,
  SearchResultItem,
} from "../models/globalSearch.types";

type GlobalSearchProps = {
  portalPathPrefix?: string;
};

const CATEGORIES: { key: SearchCategory; label: string; icon: typeof Search }[] = [
  { key: "ALL", label: "All", icon: Search },
  { key: "EMERGENCY", label: "Emergencies", icon: Siren },
  { key: "RESPONDER", label: "Responders", icon: ShieldCheck },
  { key: "VOLUNTEER", label: "Volunteers", icon: Users },
  { key: "TASK", label: "Tasks", icon: ClipboardList },
  { key: "LOCATION", label: "Locations", icon: MapPin },
  { key: "NAVIGATION", label: "Pages", icon: Compass },
];

function CategoryIcon({ type, className = "h-4 w-4" }: { type: SearchResultItem["iconType"]; className?: string }) {
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
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${toneClasses[tone]}`}
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
    activeCategory,
    setActiveCategory,
    selectedIndex,
    setSelectedIndex,
    loading,
    results,
    categoryCounts,
    selectItem,
    inputRef,
    handleKeyDown,
  } = useGlobalSearch({ portalPathPrefix });

  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  // Auto-scroll selected result into view
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  return (
    <div className="relative w-full max-w-180 mx-auto">
      {/* ── Trigger Search Bar (Always visible in Header) ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={openSearch}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openSearch();
          }
        }}
        className="group relative flex h-11 w-full cursor-text items-center rounded-lg border border-gray-300 bg-white pl-11 pr-3 text-left transition hover:border-gray-400 focus-within:border-red-500 dark:border-[#162544] dark:bg-[#0E1626] dark:hover:border-[#263e6e] dark:focus-within:border-blue-500"
      >
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition group-hover:text-gray-600 dark:text-slate-400 dark:group-hover:text-slate-200"
        />

        <span className="truncate text-sm text-gray-400 dark:text-slate-400 select-none">
          {query ? query : "Search emergencies, responders, barangays, tasks..."}
        </span>

        <div className="ml-auto flex items-center gap-1.5 pl-2">
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500 shadow-xs dark:border-[#1e3258] dark:bg-[#122036] dark:text-slate-300">
            <span className="text-[10px]">Ctrl</span> K
          </kbd>
        </div>
      </div>

      {/* ── Modal / Command Palette Dropdown ── */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
            onClick={closeSearch}
            aria-hidden="true"
          />

          {/* Palette Dialog */}
          <div
            className="fixed left-1/2 top-16 z-50 w-[min(720px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-200 dark:border-[#162544] dark:bg-[#0B1220] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]"
            role="dialog"
            aria-modal="true"
            aria-label="Global Search"
          >
            {/* Search Input Bar inside Modal */}
            <div className="relative flex items-center border-b border-gray-200 px-4 py-3 dark:border-[#162544]">
              <Search
                size={20}
                className="text-gray-400 dark:text-slate-400 shrink-0 mr-3"
              />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command, incident #, responder, or barangay..."
                className="w-full bg-transparent text-base font-medium text-gray-900 placeholder:text-gray-400 outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
              />

              {loading && (
                <Loader2 size={18} className="animate-spin text-red-600 dark:text-blue-400 mr-2" />
              )}

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-400 dark:hover:bg-[#122036] dark:hover:text-slate-200"
                  aria-label="Clear search input"
                >
                  <X size={16} />
                </button>
              )}

              <button
                type="button"
                onClick={closeSearch}
                className="ml-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300 dark:hover:bg-[#122036]"
              >
                ESC
              </button>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-gray-100 px-4 py-2.5 bg-gray-50/70 dark:border-[#162544] dark:bg-[#0E1626]/70">
              {CATEGORIES.map((cat) => {
                const count = categoryCounts[cat.key] ?? 0;
                const active = activeCategory === cat.key;
                const Icon = cat.icon;

                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setActiveCategory(cat.key)}
                    className={[
                      "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                      active
                        ? "bg-red-600 text-white shadow-xs dark:bg-blue-600"
                        : "text-gray-600 hover:bg-gray-200/60 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-[#122036] dark:hover:text-slate-200",
                    ].join(" ")}
                  >
                    <Icon size={13} />
                    {cat.label}
                    <span
                      className={[
                        "inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px]",
                        active
                          ? "bg-white/20 text-white"
                          : "bg-gray-200 text-gray-700 dark:bg-[#162544] dark:text-slate-300",
                      ].join(" ")}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Results List */}
            <div className="max-h-[390px] overflow-y-auto p-2 scroll-smooth">
              {results.length === 0 ? (
                <div className="py-12 px-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-[#0E1626] dark:text-slate-500">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="mt-3 text-sm font-bold text-gray-900 dark:text-slate-100">
                    No results found
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    We couldn't find anything matching &ldquo;{query}&rdquo;
                    {activeCategory !== "ALL" ? ` in ${activeCategory}` : ""}.
                  </div>
                  {activeCategory !== "ALL" && (
                    <button
                      type="button"
                      onClick={() => setActiveCategory("ALL")}
                      className="mt-3 text-xs font-semibold text-red-600 hover:underline dark:text-blue-400"
                    >
                      Search across all categories
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((item, index) => {
                    const isSelected = index === selectedIndex;

                    return (
                      <button
                        key={item.id}
                        ref={isSelected ? activeItemRef : null}
                        type="button"
                        onClick={() => selectItem(item)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={[
                          "group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition",
                          isSelected
                            ? "bg-red-50/80 border border-red-200 shadow-xs dark:bg-[#122036] dark:border-[#21375d]"
                            : "border border-transparent hover:bg-red-50/30 dark:hover:bg-[#0E1626]/60",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 pr-3">
                          <div
                            className={[
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition",
                              isSelected
                                ? "border-red-300 bg-white dark:border-blue-500/40 dark:bg-[#0B1220]"
                                : "border-gray-200 bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626]",
                            ].join(" ")}
                          >
                            <CategoryIcon type={item.iconType} />
                          </div>

                          <div className="min-w-0 leading-tight">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-bold text-gray-900 dark:text-slate-100">
                                {item.title}
                              </span>
                              {item.badge && (
                                <ResultBadge
                                  label={item.badge.label}
                                  tone={item.badge.tone}
                                />
                              )}
                            </div>

                            <div className="mt-0.5 truncate text-xs text-gray-600 dark:text-slate-400">
                              {item.subtitle}
                            </div>

                            {item.meta && (
                              <div className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-slate-500">
                                {item.meta}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2 text-gray-400 dark:text-slate-500">
                          {isSelected && (
                            <span className="hidden sm:inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-blue-500/20 dark:text-blue-300">
                              Select <CornerDownLeft size={11} />
                            </span>
                          )}
                          <ArrowRight
                            size={14}
                            className={
                              isSelected
                                ? "text-red-600 dark:text-blue-400"
                                : "opacity-0 group-hover:opacity-100 transition"
                            }
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Keyboard Nav Tips Footer */}
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-2.5 text-[11px] text-gray-500 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold dark:border-[#162544] dark:bg-[#0B1220]">
                    &uarr;
                  </kbd>
                  <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold dark:border-[#162544] dark:bg-[#0B1220]">
                    &darr;
                  </kbd>
                  Navigate
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold dark:border-[#162544] dark:bg-[#0B1220]">
                    &crarr;
                  </kbd>
                  Open
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold dark:border-[#162544] dark:bg-[#0B1220]">
                    Esc
                  </kbd>
                  Close
                </span>
              </div>

              <div className="text-[11px] font-semibold text-gray-400 dark:text-slate-500">
                Lifeline Global Search
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
