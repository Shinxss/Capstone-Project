import type { ReactNode } from "react";
import { useThemeMode } from "../../theme/hooks/useThemeMode";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  RefreshCcw,
  Users,
} from "lucide-react";

import EmergencyMap from "../../emergency/components/EmergencyMap";
import {
  EMERGENCY_TYPE_LABEL,
  iconForEmergency,
} from "../../emergency/constants/emergency.constants";
import type { DashboardEmergencyItem, DashboardStats } from "../models/lguDashboard.types";

function timeAgo(iso?: string) {
  if (!iso) return "-";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "-";
  const diff = Date.now() - t;
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hours ago`;
  const d = Math.floor(hr / 24);
  return `${d} days ago`;
}

function severityForStatus(status: string) {
  const s = String(status || "").toUpperCase();
  if (s === "OPEN") return { label: "critical", cls: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" };
  if (s === "ACKNOWLEDGED") return { label: "high", cls: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300" };
  if (s === "RESOLVED") return { label: "moderate", cls: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300" };
  if (s === "CANCELLED") return { label: "cancelled", cls: "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-slate-300" };
  return { label: s.toLowerCase() || "unknown", cls: "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-slate-300" };
}

function progressForStatus(status: string) {
  const s = String(status || "").toUpperCase();
  if (s === "OPEN") return 70;
  if (s === "ACKNOWLEDGED") return 85;
  if (s === "RESOLVED") return 100;
  return 40;
}

function StatCard({
  icon,
  label,
  value,
  badge,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  badge: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex items-center justify-between h-24 dark:bg-[#0E1626] dark:border-[#162544]">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center dark:bg-[#0B1324]">
          {icon}
        </div>
        <div>
          <div className="text-xl font-bold text-gray-900 dark:text-slate-100">{value}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">{label}</div>
        </div>
      </div>
      <span className="text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300 px-2 py-1 rounded-full">
        {badge}
      </span>
    </div>
  );
}

function ProgressRing({ percent, isDark }: { percent: number; isDark: boolean }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div
      className="h-10 w-10 rounded-full flex items-center justify-center text-[11px] font-bold text-gray-700 dark:text-slate-200"
      style={{
        background: `conic-gradient(#ef4444 ${p * 3.6}deg, ${isDark ? "#0B1324" : "#f3f4f6"} 0deg)`,
      }}
    >
      <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center dark:bg-[#0E1626]">{p}%</div>
    </div>
  );
}

export default function LguDashboardView({
  loading,
  error,
  onRefresh,
  stats,
  pins,
  recent,
}: {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  stats: DashboardStats;
  pins: DashboardEmergencyItem[];
  recent: DashboardEmergencyItem[];
}) {
  const { isDark } = useThemeMode();

  const activeEmergencies = recent
    .filter((e) => {
      const s = String(e.status || "").toUpperCase();
      return s === "OPEN" || s === "ACKNOWLEDGED" || s === "RESOLVED";
    })
    .slice(0, 6);

  const activity = recent.slice(0, 5).map((e) => {
    const type = EMERGENCY_TYPE_LABEL[e.type] ?? e.type;
    return {
      text: `New ${type} report logged`,
      time: timeAgo(e.reportedAt),
    };
  });

  return (
    <div className="p-6">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <div className="text-4xl font-bold text-gray-900 dark:text-slate-100">Command Center</div>
          <div className="text-base text-gray-400 dark:text-slate-400">Real-time emergency coordination dashboard</div>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 text-xs font-semibold bg-white border border-gray-200 rounded-md px-3 py-2 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:hover:bg-[#122036] dark:text-slate-200"
        >
          <RefreshCcw size={14} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/25 dark:text-red-200 rounded-lg p-3 text-sm">
          {error}
        </div>
      ) : null}

      {/* Stats (keeps old design, but Active Emergencies is real) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <StatCard
          icon={<AlertTriangle size={16} className="text-red-500" />}
          label="Active Emergencies"
          value={String(stats.active)}
          badge={loading ? "sync" : `${stats.open} open`}
        />
        <StatCard
          icon={<Users size={16} className="text-green-600" />}
          label="Available Volunteers"
          value="—"
          badge="sync"
        />
        <StatCard
          icon={<ClipboardList size={16} className="text-orange-500" />}
          label="Tasks in Progress"
          value="—"
          badge="sync"
        />
        <StatCard
          icon={<Activity size={16} className="text-blue-600" />}
          label="Response Rate"
          value="—"
          badge="sync"
        />
      </div>

      {/* Map */}
      <div className="mb-4">
        <EmergencyMap
          title="Emergency Map (Dagupan)"
          legendVariant="legacy"
          heightClassName="h-125"
          reports={pins.map((p) => ({ id: p.id, type: p.type, lng: p.lng, lat: p.lat }))}
        />
      </div>

      {/* Bottom panels (old layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-[#0E1626] dark:border-[#162544]">
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-[#162544]">
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-slate-100">Active Emergencies</div>
              <div className="text-xs text-gray-500 dark:text-slate-400">Current incidents requiring response</div>
            </div>
            <div className="text-xs text-gray-400 dark:text-slate-500">{loading ? "Loading…" : `${activeEmergencies.length} shown`}</div>
          </div>

          <div className="p-3 space-y-3">
            {!loading && activeEmergencies.length === 0 ? (
              <div className="text-sm text-gray-500 p-2 dark:text-slate-400">No emergency reports yet.</div>
            ) : null}

            {activeEmergencies.map((e) => {
              const typeLabel = EMERGENCY_TYPE_LABEL[e.type] ?? e.type;
              const Icon = iconForEmergency(e.type);
              const sev = severityForStatus(e.status);
              const percent = progressForStatus(e.status);

              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 dark:bg-[#0B1324] dark:border-[#162544]"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0 dark:bg-[#0E1626] dark:border-[#162544]">
                      <Icon size={18} className="text-red-500" />
                    </div>

                    <div className="leading-tight min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-base font-bold text-gray-900 truncate dark:text-slate-100">{typeLabel}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${sev.cls}`}>
                          {sev.label}
                        </span>
                      </div>

                      {e.notes ? (
                        <div className="text-sm text-gray-600 wrap-break-word line-clamp-2 dark:text-slate-300">{e.notes}</div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-slate-400">Pinned location</div>
                      )}

                      <div className="text-xs text-gray-400 dark:text-slate-500">{timeAgo(e.reportedAt)}</div>
                      <div className="text-xs text-gray-400 dark:text-slate-500">
                        {e.barangayName
                          ? `Barangay ${e.barangayName}, ${e.barangayCity ?? "Dagupan City"}`
                          : "Barangay: Unknown"}
                      </div>
                    </div>
                  </div>

                  <ProgressRing percent={percent} isDark={isDark} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-[#0E1626] dark:border-[#162544]">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between dark:border-[#162544]">
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-slate-100">Activity Feed</div>
              <div className="text-xs text-gray-500 dark:text-slate-400">Real-time updates</div>
            </div>
            <button className="text-xs font-semibold text-gray-700 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100">↗</button>
          </div>

          <div className="p-4 space-y-4">
            {!loading && activity.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-slate-400">No activity yet.</div>
            ) : null}

            {activity.map((a, idx) => (
              <div key={idx} className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <div className="text-sm text-gray-800 dark:text-slate-200">{a.text}</div>
                  <div className="text-xs text-gray-400 dark:text-slate-500">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
