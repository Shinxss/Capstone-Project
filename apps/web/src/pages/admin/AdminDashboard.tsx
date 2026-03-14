import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminAnalytics } from "@/features/adminAnalytics/hooks/useAdminAnalytics";
import EmergencyMap, { type MapEmergencyPin } from "@/features/emergency/components/EmergencyMap";
import { normalizeEmergencyType } from "@/features/emergency/constants/emergency.constants";
import type { EmergencyReport } from "@/features/emergency/models/emergency.types";
import { fetchEmergencyReports } from "@/features/emergency/services/emergency.service";
import { DAGUPAN_CENTER } from "@/features/lguLiveMap/constants/lguLiveMap.constants";

const DASHBOARD_MAX_BOUNDS: [[number, number], [number, number]] = [
  [120.25, 15.98],
  [120.43, 16.12],
];

function toActiveIncidentPin(report: EmergencyReport): MapEmergencyPin | null {
  const status = String(report.status || "").toUpperCase();
  if (status !== "OPEN" && status !== "ACKNOWLEDGED") return null;
  const reportWithVerification = report as EmergencyReport & {
    verification?: { status?: string };
  };
  const verificationStatus = String(reportWithVerification.verification?.status ?? "")
    .trim()
    .toLowerCase();
  if (verificationStatus === "rejected") return null;

  const coords = report.location?.coordinates;
  const lng = Array.isArray(coords) ? Number(coords[0]) : Number.NaN;
  const lat = Array.isArray(coords) ? Number(coords[1]) : Number.NaN;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

  return {
    id: String(report._id),
    type: normalizeEmergencyType(report.emergencyType),
    lng,
    lat,
  };
}

export default function AdminDashboard() {
  const { data, loading, error } = useAdminAnalytics();
  const [mapPins, setMapPins] = useState<MapEmergencyPin[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const refreshMap = useCallback(async () => {
    setMapLoading(true);
    setMapError(null);
    try {
      const reports = await fetchEmergencyReports(300);
      setMapPins(reports.map(toActiveIncidentPin).filter((pin): pin is MapEmergencyPin => pin !== null));
    } catch (err: unknown) {
      const parsed = err as { response?: { data?: { message?: string } }; message?: string };
      setMapError(parsed?.response?.data?.message ?? parsed?.message ?? "Failed to load map incidents");
    } finally {
      setMapLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMap();
  }, [refreshMap]);

  return (
    <AdminShell title="Dashboard" subtitle="Dagupan City Lifeline command center">
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex items-center">
          <div className="text-sm text-gray-600 dark:text-slate-400">{data?.scopeLabel ?? "City-wide overview"}</div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
            Loading dashboard...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : null}

        {data ? (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
              <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Emergencies</div>
              <div className="mt-2 text-2xl font-extrabold text-red-600 dark:text-red-300">{data.counts.emergencies.OPEN}</div>
              <div className="text-xs text-gray-600 dark:text-slate-400">Open incidents</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
              <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Volunteer Applications</div>
              <div className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-300">{data.counts.volunteerApplications.pending}</div>
              <div className="text-xs text-gray-600 dark:text-slate-400">Pending verification</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
              <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Dispatch Tasks</div>
              <div className="mt-2 text-2xl font-extrabold text-blue-600 dark:text-blue-300">{data.counts.dispatchTasks.PENDING}</div>
              <div className="text-xs text-gray-600 dark:text-slate-400">Pending response</div>
            </div>
          </div>
        ) : null}

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-slate-200">Live Incident Map</div>
              <div className="text-xs text-gray-600 dark:text-slate-400">
                {mapLoading && mapPins.length === 0
                  ? "Loading incidents..."
                  : `${mapPins.length} active incident${mapPins.length === 1 ? "" : "s"} shown`}
              </div>
            </div>
            <Link
              to="/admin/live-map"
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Open Full Map
            </Link>
          </div>

          {mapError ? (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {mapError}
            </div>
          ) : null}

          <EmergencyMap
            title={null}
            showHeader={false}
            showLocateButton={false}
            heightClassName="h-[360px]"
            reports={mapPins}
            center={DAGUPAN_CENTER}
            zoom={12.4}
            maxBounds={DASHBOARD_MAX_BOUNDS}
            fitReports="initial"
            navPosition="bottom-right"
            attributionPosition="bottom-left"
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
          <div className="mb-2 text-sm font-semibold text-gray-700 dark:text-slate-200">Quick Actions</div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/live-map" className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]">
              Open Live Map
            </Link>
            <Link to="/admin/tasks" className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]">
              Review Tasks
            </Link>
            <Link to="/admin/analytics" className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]">
              Analytics
            </Link>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
