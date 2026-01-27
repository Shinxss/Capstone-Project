import { useMemo, useState } from "react";
import LguShell from "../../components/lgu/LguShell";
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

type EmergencyType = "SOS" | "Flood" | "Fire" | "Typhoon" | "Earthquake" | "Collapse";
type Priority = "critical" | "high" | "medium";
type Status = "active" | "in_progress" | "resolved" | "pending";

type EmergencyItem = {
  id: string;
  type: EmergencyType;
  title: string;
  location: string;
  timeAgo: string;
  priority: Priority;
  status: Status;
  isSOS?: boolean;
  reporterLabel: string;
  reporterName: string;
  reporterVerified?: boolean;
  phone?: string;
  description: string;
  needs: string[];
  volunteersAssigned: number;
  volunteersNeeded: number;
  progressPercent: number; // 0-100
};

const typeChips: { key: "ALL" | "SOS" | EmergencyType; label: string; icon: LucideIcon }[] = [
  { key: "ALL", label: "All Types", icon: AlertTriangle },
  { key: "SOS", label: "SOS Only", icon: Siren },
  { key: "Flood", label: "Flood", icon: Droplet },
  { key: "Fire", label: "Fire", icon: Flame },
  { key: "Typhoon", label: "Typhoon", icon: Wind },
  { key: "Earthquake", label: "Earthquake", icon: Zap },
  { key: "Collapse", label: "Collapse", icon: Building2 },
];

function Pill({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
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

function priorityPill(priority: Priority) {
  if (priority === "critical") return "bg-red-100 text-red-700";
  if (priority === "high") return "bg-blue-100 text-blue-700";
  return "bg-yellow-100 text-yellow-700";
}

function statusPill(status: Status) {
  if (status === "active") return "bg-green-100 text-green-700";
  if (status === "in_progress") return "bg-yellow-100 text-yellow-700";
  if (status === "pending") return "bg-blue-100 text-blue-700";
  return "bg-gray-200 text-gray-700";
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
    red: "bg-red-50 border-red-200",
    pink: "bg-pink-50 border-pink-200",
    blue: "bg-blue-50 border-blue-200",
    yellow: "bg-yellow-50 border-yellow-200",
    green: "bg-green-50 border-green-200",
  };

  return (
    <div className={`border rounded-xl p-5 ${toneMap[tone]} flex items-center gap-4`}>
      <div className="h-10 w-10 rounded-lg bg-white/60 border border-gray-200 flex items-center justify-center">
        {icon}
      </div>
      <div className="leading-tight">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-700">{label}</div>
      </div>
    </div>
  );
}

function EmergencyCard({ item }: { item: EmergencyItem }) {
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
    : "border border-gray-200";

  const actionLabel = isSOS ? "Respond Now" : "Manage";

  return (
    <div className={`bg-white rounded-2xl text-white shadow-sm ${cardBorder} overflow-hidden`}>
      {/* SOS Strip (heartbeat) */}
      {isSOS && (
        <div className="heartbeat-strip px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold tracking-wide">
            <Siren size={16} />
            SOS EMERGENCY - IMMEDIATE RESPONSE REQUIRED
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Phone size={16} />
            {item.phone ?? "+63 9XX XXX XXXX"}
          </div>
        </div>
      )}

      <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* left */}
        <div className="flex gap-4">
          <div
            className={`h-14 w-14 rounded-2xl ${bgForType(
              item.type
            )} flex items-center justify-center`}
          >
            <Icon size={22} className="text-red-600" />
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xl font-bold text-gray-900">{item.title}</div>

              {item.isSOS && <Pill className="bg-red-100 text-red-700">SOS</Pill>}
              <Pill className={priorityPill(item.priority)}>{item.priority}</Pill>
              <Pill className={statusPill(item.status)}>
                {item.status.replace("_", " ")}
              </Pill>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                {item.location}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                {item.timeAgo}
              </div>
            </div>

            {/* reporter box */}
            <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <div className="h-9 w-9 rounded-full bg-red-100 border border-red-200 flex items-center justify-center">
                <AlertTriangle size={16} className="text-red-600" />
              </div>

              <div className="leading-tight">
                <div className="text-xs text-gray-600">{item.reporterLabel}</div>
                <div className="text-sm font-bold text-gray-900">{item.reporterName}</div>
              </div>

              {item.reporterVerified && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-800">
                  <ShieldCheck size={14} className="text-gray-700" />
                  Verified
                </span>
              )}

              {item.isSOS && (
                <button
                  type="button"
                  className="ml-4 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  <Phone size={16} />
                  Call
                </button>
              )}
            </div>

            <p className="mt-4 text-sm text-gray-700">{item.description}</p>

            {/* needs tags */}
            <div className="mt-4 flex flex-wrap gap-2">
              {item.needs.map((n) => (
                <span
                  key={n}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-800"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* right */}
        <div className="lg:border-l lg:border-gray-200 lg:pl-6 flex flex-col items-center justify-center gap-3">
          <div className="flex flex-col items-center">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center text-base font-bold text-gray-900"
              style={{
                background: `conic-gradient(#dc2626 ${item.progressPercent * 3.6}deg, #f3f4f6 0deg)`,
              }}
            >
              <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center">
                {item.progressPercent}%
              </div>
            </div>

            <div className="mt-3 text-sm font-semibold text-gray-900">
              {item.volunteersAssigned}/{item.volunteersNeeded}
            </div>
            <div className="text-xs text-gray-600">Volunteers</div>
          </div>

          <button
            type="button"
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 w-full max-w-[180px]"
          >
            {actionLabel}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LguEmergencies() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "SOS" | EmergencyType>("ALL");

  const data: EmergencyItem[] = useMemo(
    () => [
      {
        id: "sos-1",
        type: "Flood",
        title: "Flash Flood Emergency",
        location: "Barangay San Jose, Quezon City",
        timeAgo: "15 min ago",
        priority: "critical",
        status: "active",
        isSOS: true,
        reporterLabel: "SOS Reported by",
        reporterName: "Maria Santos",
        phone: "+63 917 XXX 1234",
        description:
          "Severe flooding affecting 500+ households. Immediate evacuation assistance needed.",
        needs: ["Boats", "Life vests", "Food packs", "Medical supplies"],
        volunteersAssigned: 18,
        volunteersNeeded: 25,
        progressPercent: 72,
      },
      {
        id: "fire-1",
        type: "Fire",
        title: "Residential Fire",
        location: "Barangay Poblacion, Makati",
        timeAgo: "32 min ago",
        priority: "high",
        status: "active",
        reporterLabel: "Reported by Authority",
        reporterName: "Fire Station 5",
        reporterVerified: true,
        description:
          "Multi-story residential building on fire. Evacuation and first aid required.",
        needs: ["First aid kits", "Blankets", "Water"],
        volunteersAssigned: 12,
        volunteersNeeded: 15,
        progressPercent: 80,
      },
      {
        id: "collapse-1",
        type: "Collapse",
        title: "Building Collapse",
        location: "Barangay Bagong Silang, Caloocan",
        timeAgo: "2 hours ago",
        priority: "medium",
        status: "resolved",
        reporterLabel: "Reported by User",
        reporterName: "Juan Dela Cruz",
        description: "Partial building collapse. Search and rescue operations ongoing.",
        needs: ["Heavy equipment", "Medical team", "Search dogs"],
        volunteersAssigned: 20,
        volunteersNeeded: 20,
        progressPercent: 100,
      },
      {
        id: "typhoon-1",
        type: "Typhoon",
        title: "Typhoon Evacuation Support",
        location: "Multiple Barangays, Pasig City",
        timeAgo: "1 hour ago",
        priority: "critical",
        status: "active",
        reporterLabel: "Reported by Authority",
        reporterName: "PDRRMO Pasig",
        reporterVerified: true,
        description:
          "Evacuation centers filling up. Need transport and relief distribution.",
        needs: ["Transport", "Relief goods", "Medical team"],
        volunteersAssigned: 35,
        volunteersNeeded: 50,
        progressPercent: 70,
      },
    ],
    []
  );

  const sosCount = data.filter((d) => d.isSOS).length;

  const filtered = data.filter((d) => {
    const matchesQuery =
      query.trim() === "" ||
      d.title.toLowerCase().includes(query.toLowerCase()) ||
      d.reporterName.toLowerCase().includes(query.toLowerCase());

    const matchesType =
      typeFilter === "ALL"
        ? true
        : typeFilter === "SOS"
        ? !!d.isSOS
        : d.type === typeFilter;

    return matchesQuery && matchesType;
  });

  const stats = {
    activeSOS: String(sosCount),
    critical: "3",
    high: "5",
    inProgress: "4",
    deployed: "85",
  };

  return (
    <LguShell title="Emergencies" subtitle="Monitor and manage active emergency situations">
      <div className="p-6 space-y-5">
        {/* top row */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-4xl font-bold text-gray-900 leading-tight">
              Emergencies
            </div>
            <div className="text-base text-gray-400 mt-1">
              Monitor and manage active emergency situations
            </div>
          </div>

          <button className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow hover:bg-blue-700">
            <Plus size={18} />
            Report Emergency
          </button>
        </div>

        {/* SOS alert banner (heartbeat red↔white) */}
        {sosCount > 0 && (
          <div className="heartbeat-alert border border-red-300 rounded-2xl px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-200 flex items-center justify-center">
                <Siren className="text-red-700" />
              </div>
              <div>
                <div className="text-lg font-bold text-red-700">
                  {sosCount} Active SOS Alerts
                </div>
                <div className="text-sm text-gray-600">
                  Urgent life-threatening situations requiring immediate response
                </div>
              </div>
            </div>

            <button className="rounded-xl bg-red-300/70 hover:bg-red-300 px-5 py-3 text-sm font-bold text-white">
              View SOS Reports
            </button>
          </div>
        )}

        {/* Search + chips */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1 max-w-[600px]">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-12 rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-sm outline-none focus:border-gray-300"
              placeholder="Search emergencies or reporter..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {typeChips.map((c) => {
              const Icon = c.icon;
              const active = typeFilter === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setTypeFilter(c.key)}
                  className={[
                    "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold",
                    active
                      ? "bg-red-600 border-red-600 text-white"
                      : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <Icon size={16} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <StatCard
            value={stats.activeSOS}
            label="Active SOS"
            tone="pink"
            icon={<Siren className="text-red-600" />}
          />
          <StatCard
            value={stats.critical}
            label="Critical"
            tone="pink"
            icon={<AlertTriangle className="text-red-600" />}
          />
          <StatCard
            value={stats.high}
            label="High Priority"
            tone="blue"
            icon={<Droplet className="text-blue-600" />}
          />
          <StatCard
            value={stats.inProgress}
            label="In Progress"
            tone="yellow"
            icon={<Clock className="text-yellow-700" />}
          />
          <StatCard
            value={stats.deployed}
            label="Deployed"
            tone="green"
            icon={<Users className="text-green-700" />}
          />
        </div>

        {/* List */}
        <div className="space-y-5">
          {filtered.map((item) =>
            item.isSOS ? (
              <div key={item.id} className="heartbeat-wrap rounded-2xl">
                <EmergencyCard item={item} />
              </div>
            ) : (
              <EmergencyCard key={item.id} item={item} />
            )
          )}
        </div>

        <div className="h-10" />
      </div>
    </LguShell>
  );
}
