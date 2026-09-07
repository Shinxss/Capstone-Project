import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
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
  SlidersHorizontal,
  type LucideIcon,
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

const CATEGORIES: { key: SearchCategory; label: string; icon: LucideIcon }[] = [
  { key: "ALL", label: "All", icon: SlidersHorizontal },
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

function getCategoryAccent(category: SearchCategory) {
  switch (category) {
    case "EMERGENCY":
      return {
        border: "border-l-red-600 dark:border-l-red-500",
        iconBg: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900/50",
        tag: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/40",
      };
    case "RESPONDER":
      return {
        border: "border-l-blue-600 dark:border-l-blue-500",
        iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
        tag: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40",
      };
    case "VOLUNTEER":
      return {
        border: "border-l-emerald-600 dark:border-l-emerald-500",
        iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
        tag: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40",
      };
    case "TASK":
      return {
        border: "border-l-amber-600 dark:border-l-amber-500",
        iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
        tag: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40",
      };
    case "LOCATION":
      return {
        border: "border-l-purple-600 dark:border-l-purple-500",
        iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-900/50",
        tag: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/40",
      };
    case "REPORT":
      return {
        border: "border-l-indigo-600 dark:border-l-indigo-500",
        iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50",
        tag: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900/40",
      };
    case "NAVIGATION":
    default:
      return {
        border: "border-l-gray-400 dark:border-l-slate-600",
        iconBg: "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 border-gray-200 dark:border-slate-700",
        tag: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      };
  }
}

export default function SearchResultsView({ portalPathPrefix = "/lgu" }: SearchResultsViewProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryParam = searchParams.get("q") ?? "";
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>("ALL");
  const [loading, setLoading] = useState(false);

  const [allItems, setAllItems] = useState<SearchResultItem[]>(() => [
    ...getLocationItems(portalPathPrefix),
    ...getReportAndNavItems(portalPathPrefix),
  ]);

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

  // Ranked results based on the search query from URL
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

  const handleNavigate = (item: SearchResultItem) => {
    if (item.external) {
      window.open(item.path, "_blank");
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className="w-full max-w-[1360px] px-6 md:px-8 py-4 space-y-4">
      {/* ── Category Filter Pills Bar ── */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-200/80 pb-3 dark:border-[#162544]">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 min-w-0">
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
                  "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer select-none",
                  active
                    ? "bg-red-600 text-white shadow-xs dark:bg-blue-600 dark:text-white"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-300 dark:hover:bg-[#122036]",
                ].join(" ")}
              >
                <Icon size={13} className={active ? "text-white" : "text-gray-500 dark:text-slate-400"} />
                <span>{cat.label}</span>
                <span
                  className={[
                    "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                    active
                      ? "bg-white/25 text-white"
                      : "bg-gray-100 text-gray-600 dark:bg-[#162544] dark:text-slate-300",
                  ].join(" ")}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Operational Scope Indicator */}
        <div className="hidden lg:flex shrink-0 items-center gap-2 text-xs font-medium text-gray-500 dark:text-slate-400">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Dagupan City Incident Center</span>
        </div>
      </div>

      {/* Query summary banner */}
      {queryParam && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 pl-0.5">
          <div>
            Showing <span className="font-semibold text-gray-900 dark:text-slate-200">{categoryResults.length}</span>{" "}
            operational {categoryResults.length === 1 ? "record" : "records"} for &ldquo;
            <span className="font-semibold text-gray-900 dark:text-slate-200">{queryParam}</span>&rdquo;
            {selectedCategory !== "ALL" && (
              <span className="ml-1 text-red-600 dark:text-blue-400">in {selectedCategory}</span>
            )}
          </div>

          {selectedCategory !== "ALL" && (
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className="text-xs font-semibold text-red-600 hover:underline dark:text-blue-400 cursor-pointer"
            >
              Reset filter
            </button>
          )}
        </div>
      )}

      {/* ── Purpose-Built Emergency Response Operational Cards ── */}
      <div className="space-y-3 pt-1">
        {loading ? (
          <div className="py-16 text-center">
            <div className="text-sm font-semibold text-gray-500 dark:text-slate-400">
              Querying operational incident database...
            </div>
          </div>
        ) : categoryResults.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-4 text-center rounded-xl border border-gray-200 bg-white dark:bg-[#0E1626] dark:border-[#162544]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-blue-500/10 dark:text-blue-400">
              <AlertTriangle size={24} />
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-slate-100">
              No matching records found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              No incidents, personnel, tasks, or Dagupan barangays matched
              {queryParam ? ` "${queryParam}"` : ""}
              {selectedCategory !== "ALL" ? ` in ${selectedCategory}` : ""}.
            </p>
            {selectedCategory !== "ALL" && (
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline dark:text-blue-400 cursor-pointer"
              >
                View all categories ({matchingResults.length})
              </button>
            )}
          </div>
        ) : (
          categoryResults.map((item) => {
            const accent = getCategoryAccent(item.category);
            const isEmergency = item.category === "EMERGENCY";
            const isOpenEmergency =
              isEmergency &&
              (!item.rawStatus ||
                item.rawStatus.toLowerCase() === "open" ||
                item.rawStatus.toLowerCase() === "pending" ||
                item.rawStatus.toLowerCase() === "critical");

            return (
              <div
                key={item.id}
                onClick={() => handleNavigate(item)}
                className={[
                  "group relative flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-xs transition-all duration-150 cursor-pointer",
                  "border-l-4",
                  accent.border,
                  "hover:border-red-300 hover:shadow-md dark:bg-[#0E1626] dark:border-[#162544] dark:hover:border-blue-500/50",
                ].join(" ")}
              >
                {/* Main Identity & Content */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Category Glyph Icon */}
                  <div
                    className={[
                      "shrink-0 flex h-11 w-11 items-center justify-center rounded-xl border",
                      accent.iconBg,
                      isOpenEmergency ? "ring-2 ring-red-500/20 dark:ring-red-400/30" : "",
                    ].join(" ")}
                  >
                    <ItemIcon type={item.iconType} className="h-5 w-5" />
                  </div>

                  {/* Operational Data Details */}
                  <div className="min-w-0 flex-1">
                    {/* Top Tag Row */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${accent.tag}`}
                      >
                        {isOpenEmergency && (
                          <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping dark:bg-red-400" />
                        )}
                        {item.category}
                      </span>

                      {item.badge && (
                        <ResultBadge label={item.badge.label} tone={item.badge.tone} />
                      )}

                      {/* Geographic coordinates if incident or barangay location */}
                      {item.coordinates && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-[#122036] px-2 py-0.5 rounded border border-gray-100 dark:border-[#162544]">
                          <MapPin size={11} className="text-red-500 dark:text-blue-400" />
                          {item.coordinates[1].toFixed(4)}° N, {item.coordinates[0].toFixed(4)}° E
                        </span>
                      )}
                    </div>

                    {/* Incident / Entity Title */}
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-red-600 dark:text-slate-100 dark:group-hover:text-blue-400 transition leading-snug">
                      {item.title}
                    </h3>

                    {/* Location / Subtitle line */}
                    <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-slate-300 flex items-center gap-1.5">
                      {item.category === "EMERGENCY" || item.category === "LOCATION" ? (
                        <MapPin size={13} className="shrink-0 text-red-500 dark:text-blue-400" />
                      ) : null}
                      <span className="truncate">{item.subtitle}</span>
                    </p>

                    {/* Meta info (e.g. Reporter name, Team, Contact No) */}
                    {item.meta && (
                      <div className="mt-1.5 text-xs text-gray-500 dark:text-slate-400 font-medium">
                        {item.meta}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Button */}
                <div className="shrink-0 flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-[#162544]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate(item);
                    }}
                    className={[
                      "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer",
                      isEmergency
                        ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                        : "bg-red-600 text-white hover:bg-red-700 dark:bg-blue-600 dark:hover:bg-blue-700",
                    ].join(" ")}
                  >
                    <span>{getActionLabel(item.iconType)}</span>
                    {item.external ? <ExternalLink size={13} /> : <ArrowRight size={13} />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
