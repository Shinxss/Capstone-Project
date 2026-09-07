import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Siren,
  ShieldCheck,
  Users,
  ClipboardList,
  MapPin,
  FileText,
  Compass,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import {
  fetchSearchDataset,
  filterAndRankItems,
  getLocationItems,
  getReportAndNavItems,
} from "../services/globalSearch.service";
import type {
  SearchCategory,
  SearchResultBadgeTone,
  SearchResultItem,
} from "../models/globalSearch.types";

type SearchResultsViewProps = {
  portalPathPrefix?: string;
};

const CATEGORIES: { key: SearchCategory; label: string; icon: typeof Search }[] = [
  { key: "ALL", label: "All Results", icon: SlidersHorizontal },
  { key: "EMERGENCY", label: "Emergencies", icon: Siren },
  { key: "RESPONDER", label: "Responders", icon: ShieldCheck },
  { key: "VOLUNTEER", label: "Volunteers", icon: Users },
  { key: "TASK", label: "Tasks", icon: ClipboardList },
  { key: "LOCATION", label: "Locations", icon: MapPin },
  { key: "REPORT", label: "Reports & Analytics", icon: FileText },
  { key: "NAVIGATION", label: "Navigation", icon: Compass },
];

function ItemIcon({
  type,
  className = "h-5 w-5",
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
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider shrink-0 ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}

function getActionLabel(type: SearchResultItem["iconType"]) {
  switch (type) {
    case "emergency":
      return "View on Map";
    case "responder":
      return "View Profile";
    case "volunteer":
      return "View Volunteer";
    case "task":
      return "View Task";
    case "location":
      return "Explore Map";
    case "report":
      return "Open Report";
    case "navigation":
    default:
      return "Go to Page";
  }
}

export default function SearchResultsView({ portalPathPrefix = "/lgu" }: SearchResultsViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryParam = searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>("ALL");
  const [loading, setLoading] = useState(false);

  const [allItems, setAllItems] = useState<SearchResultItem[]>(() => [
    ...getLocationItems(portalPathPrefix),
    ...getReportAndNavItems(portalPathPrefix),
  ]);

  // Sync state if URL query param changes
  useEffect(() => {
    setSearchInput(queryParam);
  }, [queryParam]);

  // Fetch operational dataset
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSearchDataset(portalPathPrefix)
      .then((data) => {
        if (!cancelled) setAllItems(data);
      })
      .catch(() => {
        // Keep initial dataset on error
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [portalPathPrefix]);

  // Ranked results based on the search query
  const matchingResults = useMemo(() => {
    return filterAndRankItems(allItems, queryParam);
  }, [allItems, queryParam]);

  // Filtered by the active category tab
  const categoryResults = useMemo(() => {
    if (selectedCategory === "ALL") return matchingResults;
    return matchingResults.filter((item) => item.category === selectedCategory);
  }, [matchingResults, selectedCategory]);

  // Calculate counts for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<SearchCategory, number> = {
      ALL: matchingResults.length,
      EMERGENCY: 0,
      RESPONDER: 0,
      VOLUNTEER: 0,
      TASK: 0,
      LOCATION: 0,
      REPORT: 0,
      NAVIGATION: 0,
    };

    for (const item of matchingResults) {
      if (counts[item.category] !== undefined) {
        counts[item.category] += 1;
      }
    }

    return counts;
  }, [matchingResults]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(searchInput.trim() ? { q: searchInput.trim() } : {});
  };

  const handleClear = () => {
    setSearchInput("");
    setSearchParams({});
  };

  const handleNavigate = (item: SearchResultItem) => {
    if (item.external) {
      window.open(item.path, "_blank");
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* ── Top Search Bar & Summary ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-[#162544] dark:bg-[#0B1220]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Search Results
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              {queryParam ? (
                <>
                  Showing results for &ldquo;
                  <span className="font-semibold text-gray-800 dark:text-slate-200">
                    {queryParam}
                  </span>
                  &rdquo; ({matchingResults.length} total matches)
                </>
              ) : (
                "Search across all emergency reports, responders, volunteers, tasks, and locations"
              )}
            </p>
          </div>

          {queryParam && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300 dark:hover:bg-[#122036]"
            >
              <RotateCcw size={13} />
              Clear query
            </button>
          )}
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="mt-5 relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search emergencies, responders, volunteers, tasks, locations..."
              className="w-full h-11 rounded-xl border border-gray-300 bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
            />
          </div>

          <button
            type="submit"
            className="h-11 px-5 rounded-xl font-semibold text-sm bg-red-600 text-white shadow-xs hover:bg-red-700 transition dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Search
          </button>
        </form>

        {/* ── Category Filter Tabs ── */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto border-t border-gray-100 pt-5 dark:border-[#162544]">
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.key] ?? 0;
            const active = selectedCategory === cat.key;
            const Icon = cat.icon;

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={[
                  "inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition",
                  active
                    ? "bg-red-600 text-white shadow-xs dark:bg-blue-600"
                    : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300 dark:hover:bg-[#122036]",
                ].join(" ")}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[10px]",
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
      </div>

      {/* ── Results List ── */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-[#162544] dark:bg-[#0B1220]">
            <div className="text-sm font-semibold text-gray-500 dark:text-slate-400">
              Loading results...
            </div>
          </div>
        ) : categoryResults.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-xs dark:border-[#162544] dark:bg-[#0B1220]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-blue-500/10 dark:text-blue-400">
              <AlertTriangle size={24} />
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-slate-100">
              No results found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              We couldn&apos;t find any matches
              {queryParam ? ` for "${queryParam}"` : ""}
              {selectedCategory !== "ALL" ? ` in ${selectedCategory}` : ""}.
            </p>
            {selectedCategory !== "ALL" && (
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:underline dark:text-blue-400"
              >
                View all categories ({matchingResults.length})
              </button>
            )}
          </div>
        ) : (
          categoryResults.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-xs dark:border-[#162544] dark:bg-[#0B1220] dark:hover:border-[#263e6e]"
            >
              <div className="flex items-start gap-4 min-w-0">
                {/* Icon */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626]">
                  <ItemIcon type={item.iconType} className="h-5 w-5" />
                </div>

                {/* Details */}
                <div className="min-w-0 leading-tight">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-gray-900 dark:text-slate-100">
                      {item.title}
                    </span>
                    {item.badge && (
                      <ResultBadge
                        label={item.badge.label}
                        tone={item.badge.tone}
                      />
                    )}
                  </div>

                  <p className="mt-1 text-sm text-gray-600 dark:text-slate-400 line-clamp-2">
                    {item.subtitle}
                  </p>

                  {item.meta && (
                    <div className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                      {item.meta}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleNavigate(item)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-bold text-gray-800 transition hover:bg-red-50 hover:border-red-200 hover:text-red-700 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036] dark:hover:border-blue-500/30 dark:hover:text-blue-300"
              >
                <span>{getActionLabel(item.iconType)}</span>
                {item.external ? <ExternalLink size={14} /> : <ArrowRight size={14} />}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
