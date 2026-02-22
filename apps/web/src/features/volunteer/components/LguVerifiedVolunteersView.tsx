import { Activity, ChevronDown, CircleCheck, Clock3, MapPin, Plus, Search, ShieldCheck, Star } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import VerifiedVolunteerDetailsModal from "./VerifiedVolunteerDetailsModal";
import type { VolunteerApplication } from "../models/volunteerApplication.types";
import { useLguVerifiedVolunteers } from "../hooks/useLguVerifiedVolunteers";

type Props = ReturnType<typeof useLguVerifiedVolunteers> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

type SkillFilterKey = "all" | "medical" | "search_rescue" | "logistics" | "communication" | "driving";
type AvailabilityStatus = "available" | "deployed";

type VolunteerExtras = VolunteerApplication & {
  skills?: string[] | string;
  skill?: string;
  deploymentStatus?: string;
  availabilityStatus?: string;
  tasksCompleted?: number;
  completedTasks?: number;
  taskCount?: number;
  rating?: number;
  avgRating?: number;
};

const skillFilters: Array<{ key: SkillFilterKey; label: string; keywords: string[] }> = [
  { key: "all", label: "All Skills", keywords: [] },
  { key: "medical", label: "Medical", keywords: ["medical", "first aid", "emt", "nurse", "trauma", "health"] },
  { key: "search_rescue", label: "Search & Rescue", keywords: ["search", "rescue", "sar", "retrieval"] },
  { key: "logistics", label: "Logistics", keywords: ["logistics", "supply", "inventory", "warehouse", "distribution"] },
  { key: "communication", label: "Communication", keywords: ["communication", "radio", "dispatcher", "comms", "coordination"] },
  { key: "driving", label: "Driving", keywords: ["driving", "driver", "transport", "vehicle", "motor"] },
];

const statusStyles: Record<
  AvailabilityStatus,
  { label: string; pillClass: string; actionLabel: string; actionClass: string }
> = {
  available: {
    label: "available",
    pillClass:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
    actionLabel: "Deploy",
    actionClass:
      "rounded-xl bg-[#DC2626] px-5 py-2.5 text-sm font-black text-white hover:bg-[#c81e1e]",
  },
  deployed: {
    label: "deployed",
    pillClass:
      "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300",
    actionLabel: "View",
    actionClass:
      "rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-black text-gray-700 hover:bg-gray-50 dark:border-[#22365D] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]",
  },
};

function normalizeText(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function splitSkillTokens(raw: string) {
  return raw
    .split(/[,/;|\n]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function initialsFromName(fullName: string) {
  const tokens = fullName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (tokens.length === 0) return "VV";
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return `${tokens[0][0] ?? ""}${tokens[1][0] ?? ""}`.toUpperCase();
}

function formatTimeAgo(iso?: string) {
  if (!iso) return "Recently verified";

  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return "Recently verified";

  const diffMs = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return "Active now";
  if (mins < 60) return `${mins} min ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function getLocationLabel(volunteer: VolunteerApplication) {
  const city = volunteer.city?.trim();
  const barangay = volunteer.barangay?.trim();
  const province = volunteer.province?.trim();

  if (city) return city;
  if (barangay) return barangay;
  if (province) return province;
  return "Location unavailable";
}

function getRoleLabel(volunteer: VolunteerApplication) {
  return (
    volunteer.preferredAssignmentText?.trim() ||
    volunteer.certificationsText?.trim() ||
    "Verified Volunteer"
  );
}

function getSkillTags(volunteer: VolunteerApplication) {
  const v = volunteer as VolunteerExtras;
  const rawSkills: string[] = [];

  if (Array.isArray(v.skills)) rawSkills.push(...v.skills.map((x) => String(x)));
  if (typeof v.skills === "string") rawSkills.push(v.skills);
  if (typeof v.skill === "string") rawSkills.push(v.skill);
  if (volunteer.skillsOther) rawSkills.push(volunteer.skillsOther);
  if (volunteer.certificationsText) rawSkills.push(volunteer.certificationsText);

  const parsed = rawSkills.flatMap(splitSkillTokens);
  if (parsed.length === 0 && volunteer.preferredAssignmentText?.trim()) {
    parsed.push(volunteer.preferredAssignmentText.trim());
  }

  if (parsed.length === 0) return ["General"];

  const seen = new Set<string>();
  return parsed.filter((tag) => {
    const key = tag.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getAvailabilityStatus(volunteer: VolunteerApplication): AvailabilityStatus {
  const v = volunteer as VolunteerExtras;
  const source = normalizeText(
    v.deploymentStatus,
    v.availabilityStatus,
    volunteer.availabilityText,
    volunteer.preferredAssignmentText
  );

  const deployedTerms = [
    "deployed",
    "deploy",
    "on duty",
    "assigned",
    "busy",
    "responding",
    "active now",
    "in field",
  ];

  if (deployedTerms.some((term) => source.includes(term))) return "deployed";
  return "available";
}

function matchesSkillFilter(volunteer: VolunteerApplication, tags: string[], filterKey: SkillFilterKey) {
  if (filterKey === "all") return true;

  const selected = skillFilters.find((item) => item.key === filterKey);
  if (!selected) return true;

  const haystack = normalizeText(
    tags.join(" "),
    volunteer.skillsOther,
    volunteer.certificationsText,
    volunteer.preferredAssignmentText
  );

  return selected.keywords.some((keyword) => haystack.includes(keyword));
}

function getTaskCount(volunteer: VolunteerApplication): number | null {
  const v = volunteer as VolunteerExtras;
  const value = Number(v.tasksCompleted ?? v.completedTasks ?? v.taskCount);
  return Number.isFinite(value) ? value : null;
}

function getRating(volunteer: VolunteerApplication): number | null {
  const v = volunteer as VolunteerExtras;
  const value = Number(v.rating ?? v.avgRating);
  return Number.isFinite(value) ? value : null;
}

function SummaryCard({
  value,
  label,
  icon,
  tone,
}: {
  value: string;
  label: string;
  icon: ReactNode;
  tone: "green" | "blue" | "rose" | "indigo";
}) {
  const toneMap: Record<typeof tone, string> = {
    green:
      "border-emerald-300 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/10",
    blue: "border-sky-300 bg-sky-50 dark:border-sky-500/25 dark:bg-sky-500/10",
    rose: "border-rose-300 bg-rose-50 dark:border-rose-500/25 dark:bg-rose-500/10",
    indigo:
      "border-indigo-300 bg-indigo-50 dark:border-indigo-500/25 dark:bg-indigo-500/10",
  };

  return (
    <div className={`flex items-center gap-4 rounded-2xl border p-5 ${toneMap[tone]}`}>
      <div className="grid h-10 w-10 place-items-center rounded-lg border border-gray-200 bg-white/70 dark:border-[#22365D] dark:bg-[#0E1626]/70">
        {icon}
      </div>
      <div className="leading-tight">
        <div className="text-4xl font-black text-gray-900 dark:text-slate-100">{value}</div>
        <div className="text-sm text-gray-700 dark:text-slate-300">{label}</div>
      </div>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
      Loading...
    </div>
  );
}

function ErrorPanel({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:border-red-500/25 dark:text-red-200">
      <div className="flex items-center justify-between gap-3">
        <span>{error}</span>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function LguVerifiedVolunteersView(props: Props) {
  const {
    loading,
    error,
    onRefresh,
    items,
    total,
    query,
    setQuery,
    open,
    selected,
    detailsLoading,
    detailsError,
    openDetails,
    closeDetails,
  } = props;

  const [skillFilter, setSkillFilter] = useState<SkillFilterKey>("all");
  const [skillMenuOpen, setSkillMenuOpen] = useState(false);

  const cards = useMemo(
    () =>
      items.map((volunteer) => {
        const availability = getAvailabilityStatus(volunteer);
        return {
          volunteer,
          availability,
          statusUI: statusStyles[availability],
          roleLabel: getRoleLabel(volunteer),
          locationLabel: getLocationLabel(volunteer),
          timeAgo: formatTimeAgo(volunteer.reviewedAt || volunteer.updatedAt || volunteer.createdAt),
          initials: initialsFromName(volunteer.fullName),
          skillTags: getSkillTags(volunteer),
          taskCount: getTaskCount(volunteer),
          rating: getRating(volunteer),
        };
      }),
    [items]
  );

  const filteredCards = useMemo(
    () =>
      cards.filter((card) =>
        matchesSkillFilter(card.volunteer, card.skillTags, skillFilter)
      ),
    [cards, skillFilter]
  );

  const summary = useMemo(() => {
    const base = skillFilter === "all" ? cards : filteredCards;
    const ratingValues = base
      .map((card) => card.rating)
      .filter((value): value is number => typeof value === "number");
    const avgRating =
      ratingValues.length > 0
        ? (ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length).toFixed(1)
        : "N/A";

    const verifiedCount = skillFilter === "all" ? total : filteredCards.length;
    const deployedCount = base.filter((card) => card.availability === "deployed").length;
    const availableCount = base.filter((card) => card.availability === "available").length;

    return {
      verified: verifiedCount.toLocaleString(),
      deployed: deployedCount.toLocaleString(),
      available: availableCount.toLocaleString(),
      avgRating,
    };
  }, [cards, filteredCards, skillFilter, total]);

  if (loading) return <LoadingPanel />;
  if (error) return <ErrorPanel error={error} onRetry={onRefresh} />;

  const visibleSkillFilters = skillFilters.slice(0, 4);
  const dropdownSkillFilters = skillFilters.slice(4);
  const moreActive = dropdownSkillFilters.some((item) => item.key === skillFilter);

  return (
    <>
      <div className="space-y-5 p-6">
        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-[#DC2626] px-4 py-2.5 text-sm font-black text-white hover:bg-[#c81e1e]"
          >
            <Plus size={16} />
            Register Volunteer
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            value={summary.verified}
            label="Verified"
            tone="green"
            icon={<ShieldCheck className="text-emerald-700" size={18} />}
          />
          <SummaryCard
            value={summary.deployed}
            label="Deployed"
            tone="blue"
            icon={<Activity className="text-sky-700" size={18} />}
          />
          <SummaryCard
            value={summary.available}
            label="Available"
            tone="rose"
            icon={<CircleCheck className="text-rose-600" size={18} />}
          />
          <SummaryCard
            value={summary.avgRating}
            label="Avg. Rating"
            tone="indigo"
            icon={<Star className="text-indigo-600" size={18} />}
          />
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative w-full xl:max-w-2xl">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-500"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search verified volunteers..."
              className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#2B4A7A]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {visibleSkillFilters.map((filterItem) => {
              const active = skillFilter === filterItem.key;
              return (
                <button
                  key={filterItem.key}
                  type="button"
                  onClick={() => {
                    setSkillFilter(filterItem.key);
                    setSkillMenuOpen(false);
                  }}
                  className={[
                    "shrink-0 whitespace-nowrap rounded-2xl border px-4 py-2 text-sm font-bold",
                    active
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300 dark:hover:bg-[#122036]",
                  ].join(" ")}
                >
                  {filterItem.label}
                </button>
              );
            })}

            {dropdownSkillFilters.length > 0 ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSkillMenuOpen((prev) => !prev)}
                  className={[
                    "inline-flex items-center gap-1 rounded-2xl border px-4 py-2 text-sm font-bold",
                    moreActive || skillMenuOpen
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300 dark:hover:bg-[#122036]",
                  ].join(" ")}
                >
                  More
                  <ChevronDown size={15} />
                </button>

                {skillMenuOpen ? (
                  <div className="absolute right-0 top-full z-20 mt-2 min-w-[180px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-[#22365D] dark:bg-[#0E1626]">
                    {dropdownSkillFilters.map((filterItem) => {
                      const active = skillFilter === filterItem.key;
                      return (
                        <button
                          key={filterItem.key}
                          type="button"
                          onClick={() => {
                            setSkillFilter(filterItem.key);
                            setSkillMenuOpen(false);
                          }}
                          className={[
                            "block w-full px-4 py-2 text-left text-sm font-semibold",
                            active
                              ? "bg-red-600 text-white"
                              : "text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-[#122036]",
                          ].join(" ")}
                        >
                          {filterItem.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}

          </div>
        </div>

        {filteredCards.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
            No verified volunteers match the current filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCards.map((card) => (
              <div
                key={card.volunteer._id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-[#162544] dark:bg-[#0B1220]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-rose-200 bg-rose-100 text-lg font-black text-red-600 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300">
                      {card.initials}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-2xl font-black leading-none text-gray-900 dark:text-slate-100">
                        {card.volunteer.fullName}
                      </div>
                      <div className="mt-1 truncate text-sm text-gray-600 dark:text-slate-400">
                        {card.roleLabel}
                      </div>
                      <span
                        className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${card.statusUI.pillClass}`}
                      >
                        {card.statusUI.label}
                      </span>
                    </div>
                  </div>

                  <ShieldCheck size={18} className="mt-1 text-red-500 dark:text-red-300" />
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400 dark:text-slate-500" />
                    {card.locationLabel}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock3 size={16} className="text-gray-400 dark:text-slate-500" />
                    {card.timeAgo}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {card.skillTags.slice(0, 4).map((skill) => (
                    <span
                      key={`${card.volunteer._id}-${skill}`}
                      className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-800 dark:border-[#22365D] dark:bg-[#0E1626] dark:text-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex items-end justify-between border-t border-gray-200 pt-4 dark:border-[#162544]">
                  <div className="flex items-end gap-6">
                    <div className="leading-none">
                      <div className="text-4xl font-black text-gray-900 dark:text-slate-100">
                        {card.taskCount ?? "--"}
                      </div>
                      <div className="mt-1 text-sm text-gray-600 dark:text-slate-400">Tasks</div>
                    </div>

                    <div className="leading-none">
                      <div className="flex items-center gap-1 text-4xl font-black text-gray-900 dark:text-slate-100">
                        <Star size={18} className="fill-blue-600 text-blue-600" />
                        {card.rating != null ? card.rating.toFixed(1) : "--"}
                      </div>
                      <div className="mt-1 text-sm text-gray-600 dark:text-slate-400">Rating</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void openDetails(card.volunteer._id)}
                    className={card.statusUI.actionClass}
                  >
                    {card.statusUI.actionLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <VerifiedVolunteerDetailsModal
        open={open}
        loading={detailsLoading}
        error={detailsError}
        data={selected}
        onClose={closeDetails}
      />
    </>
  );
}
