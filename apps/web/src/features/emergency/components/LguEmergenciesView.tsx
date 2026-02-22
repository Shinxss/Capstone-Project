import {
  Plus,
  Search,
  Siren,
  Droplet,
  Flame,
  Wind,
  Zap,
  Building2,
  Phone,
  ShieldCheck,
  AlertTriangle,
  Clock,
  MapPin,
  ChevronRight,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { EmergencyType, LguEmergencyItem, LguEmergencyTypeFilter, useLguEmergencies } from "../hooks/useLguEmergencies";

type Props = ReturnType<typeof useLguEmergencies> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

const typeChips: { key: LguEmergencyTypeFilter; label: string; icon: LucideIcon }[] = [
  { key: "ALL", label: "All Types", icon: AlertTriangle },
  { key: "SOS", label: "SOS Only", icon: Siren },
  { key: "Flood", label: "Flood", icon: Droplet },
  { key: "Fire", label: "Fire", icon: Flame },
  { key: "Typhoon", label: "Typhoon", icon: Wind },
  { key: "Earthquake", label: "Earthquake", icon: Zap },
  { key: "Collapse", label: "Collapse", icon: Building2 },
];

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>{children}</span>;
}

function iconForType(type: EmergencyType): LucideIcon {
  switch (type) {
    case "SOS":
      return Siren;
    case "Flood":
      return Droplet;
    case "Fire":
      return Flame;
    case "Typhoon":
      return Wind;
    case "Earthquake":
      return Zap;
    case "Collapse":
      return Building2;
    default:
      return AlertTriangle;
  }
}

function bgForType(type: EmergencyType) {
  switch (type) {
    case "Fire":
      return "bg-blue-100";
    case "Flood":
      return "bg-red-100";
    case "Collapse":
      return "bg-yellow-100";
    case "Typhoon":
      return "bg-red-100";
    case "Earthquake":
      return "bg-purple-100";
    case "SOS":
      return "bg-red-100";
    default:
      return "bg-gray-100";
  }
}

function priorityPill(priority: "critical" | "high" | "medium") {
  if (priority === "critical") return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";
  if (priority === "high") return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";
  return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300";
}

function statusPill(status: "active" | "in_progress" | "resolved" | "pending") {
  if (status === "active") return "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300";
  if (status === "in_progress") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300";
  if (status === "pending") return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";
  return "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-slate-300";
}

function StatCard({
  value,
  label,
  tone,
  icon,
}: {
  value: string;
  label: string;
  tone: "red" | "pink" | "blue" | "yellow" | "green";
  icon: React.ReactNode;
}) {
  const toneMap: Record<typeof tone, string> = {
    red: "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/25",
    pink: "bg-pink-50 border-pink-200 dark:bg-pink-500/10 dark:border-pink-500/25",
    blue: "bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/25",
    yellow: "bg-yellow-50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/25",
    green: "bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/25",
  };

  return (
    <div className={`flex items-center gap-4 rounded-xl border p-5 ${toneMap[tone]}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white/60 dark:border-[#162544] dark:bg-[#0E1626]/70">{icon}</div>
      <div className="leading-tight">
        <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">{value}</div>
        <div className="text-sm text-gray-700 dark:text-slate-300">{label}</div>
      </div>
    </div>
  );
}

function EmergencyCard({
  item,
  onActionClick,
}: {
  item: LguEmergencyItem;
  onActionClick: (item: LguEmergencyItem) => void;
}) {
  const Icon = iconForType(item.type);
  const isSOS = !!item.isSOS;

  const cardBorder = isSOS
    ? "border-2 border-red-500"
    : item.type === "Fire"
      ? "border-l-4 border-l-blue-600"
      : item.type === "Collapse"
        ? "border-l-4 border-l-yellow-500"
        : item.type === "Typhoon"
          ? "border-l-4 border-l-red-600"
          : "border border-gray-200 dark:border-[#162544]";

  const actionLabel = isSOS ? "Respond Now" : "Manage";

  return (
    <div className={`overflow-hidden rounded-2xl bg-white text-white shadow-sm dark:bg-[#0B1220] ${cardBorder}`}>
      {isSOS ? (
        <div className="heartbeat-strip flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2 text-sm font-bold tracking-wide">
            <Siren size={16} />
            SOS EMERGENCY - IMMEDIATE RESPONSE REQUIRED
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Phone size={16} />
            {item.phone ?? "+63 9XX XXX XXXX"}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_280px]">
        <div className="flex gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${bgForType(item.type)}`}>
            <Icon size={22} className="text-red-600" />
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xl font-bold text-gray-900 dark:text-slate-100">{item.title}</div>
              {item.isSOS ? <Pill className="bg-red-100 text-red-700">SOS</Pill> : null}
              <Pill className={priorityPill(item.priority)}>{item.priority}</Pill>
              <Pill className={statusPill(item.status)}>{item.status.replace("_", " ")}</Pill>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400 dark:text-slate-500" />
                {item.location}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400 dark:text-slate-500" />
                {item.timeAgo}
              </div>
            </div>

            <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/25 dark:bg-red-500/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-100 dark:border-red-500/25 dark:bg-red-500/15">
                <AlertTriangle size={16} className="text-red-600" />
              </div>

              <div className="leading-tight">
                <div className="text-xs text-gray-600 dark:text-slate-400">{item.reporterLabel}</div>
                <div className="text-sm font-bold text-gray-900 dark:text-slate-100">{item.reporterName}</div>
              </div>

              {item.reporterVerified ? (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-800 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200">
                  <ShieldCheck size={14} className="text-gray-700 dark:text-slate-300" />
                  Verified
                </span>
              ) : null}

              {item.isSOS ? (
                <button
                  type="button"
                  className="ml-4 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  <Phone size={16} />
                  Call
                </button>
              ) : null}
            </div>

            <p className="mt-4 text-sm text-gray-700 dark:text-slate-300">{item.description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {item.needs.map((need) => (
                <span key={need} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-800 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200">
                  {need}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 lg:border-l lg:border-gray-200 lg:pl-6 dark:lg:border-[#162544]">
          <div className="flex flex-col items-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-base font-bold text-gray-900 dark:text-slate-100"
              style={{ background: `conic-gradient(#dc2626 ${item.progressPercent * 3.6}deg, #f3f4f6 0deg)` }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white dark:bg-[#0E1626]">{item.progressPercent}%</div>
            </div>

            <div className="mt-3 text-sm font-semibold text-gray-900 dark:text-slate-100">
              {item.volunteersAssigned}/{item.volunteersNeeded}
            </div>
            <div className="text-xs text-gray-600 dark:text-slate-400">Volunteers</div>
          </div>

          <button
            type="button"
            onClick={() => onActionClick(item)}
            className="mt-2 inline-flex w-full max-w-[180px] items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700"
          >
            {actionLabel}
            <ChevronRight size={18} />
          </button>
        </div>
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

export default function LguEmergenciesView(props: Props) {
  const navigate = useNavigate();
  const { loading, error, onRefresh, query, setQuery, typeFilter, setTypeFilter, items, stats, filtered } = props;

  const activeItems = items.filter((item) => item.status === "active");
  const activeSosItems = activeItems.filter((item) => item.isSOS);
  const activeSosCount = activeSosItems.length;
  const activeSosVolunteersAssigned = activeSosItems.reduce((sum, item) => sum + item.volunteersAssigned, 0);
  const activeSosVolunteersNeeded = activeSosItems.reduce((sum, item) => sum + item.volunteersNeeded, 0);
  const visibleItems = filtered.filter((item) => item.status === "active");

  const handleEmergencyAction = (item: LguEmergencyItem) => {
    const emergencyId = String(item.id || "").trim();
    if (!emergencyId) {
      navigate("/lgu/live-map");
      return;
    }
    navigate(`/lgu/live-map?emergencyId=${encodeURIComponent(emergencyId)}`);
  };

  if (loading) return <LoadingPanel />;
  if (error) return <ErrorPanel error={error} onRetry={onRefresh} />;

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-4xl font-bold leading-tight text-gray-900 dark:text-slate-100">Emergencies</div>
          <div className="mt-1 text-base text-gray-400 dark:text-slate-400">Monitor and manage active emergency situations</div>
        </div>

        <button className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow hover:bg-blue-700">
          <Plus size={18} />
          Report Emergency
        </button>
      </div>

      {activeSosCount > 0 ? (
        <div className="heartbeat-alert flex items-center justify-between rounded-2xl border border-red-300 px-6 py-5 dark:border-red-500/25 dark:bg-red-500/10">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-200 dark:bg-red-500/20">
              <Siren className="text-red-700" />
            </div>
            <div>
              <div className="text-lg font-bold text-red-700">{activeSosCount} Active SOS Alerts</div>
              <div className="text-sm text-gray-600 dark:text-slate-300">Urgent life-threatening situations requiring immediate response</div>
              <div className="text-sm font-semibold text-gray-700 dark:text-slate-200">{activeSosVolunteersAssigned}/{activeSosVolunteersNeeded} Volunteers</div>
            </div>
          </div>

          <button
            onClick={() => setTypeFilter("SOS")}
            className="rounded-xl bg-red-300/70 px-5 py-3 text-sm font-bold text-white hover:bg-red-300"
          >
            View SOS Reports
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative max-w-[600px] flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#2B4A7A]"
            placeholder="Search emergencies or reporter..."
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {typeChips.map((chip) => {
            const Icon = chip.icon;
            const active = typeFilter === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setTypeFilter(chip.key)}
                className={[
                  "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold",
                  active
                    ? "border-red-600 bg-red-600 text-white"
                    : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]",
                ].join(" ")}
              >
                <Icon size={16} />
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard value={String(activeSosCount)} label="Active SOS" tone="pink" icon={<Siren className="text-red-600" />} />
        <StatCard value={stats.critical} label="Critical" tone="pink" icon={<AlertTriangle className="text-red-600" />} />
        <StatCard value={stats.high} label="High Priority" tone="blue" icon={<Droplet className="text-blue-600" />} />
        <StatCard value={stats.inProgress} label="In Progress" tone="yellow" icon={<Clock className="text-yellow-700" />} />
        <StatCard value={stats.deployed} label="Deployed" tone="green" icon={<Users className="text-green-700" />} />
      </div>

      <div className="space-y-5">
        {visibleItems.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">No emergency reports found.</div>
        ) : (
          visibleItems.map((item) =>
            item.isSOS ? (
              <div key={item.id} className="heartbeat-wrap rounded-2xl">
                <EmergencyCard item={item} onActionClick={handleEmergencyAction} />
              </div>
            ) : (
              <EmergencyCard key={item.id} item={item} onActionClick={handleEmergencyAction} />
            )
          )
        )}
      </div>

      <div className="h-10" />
    </div>
  );
}
