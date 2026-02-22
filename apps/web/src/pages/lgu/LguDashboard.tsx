import LguShell from "../../components/lgu/LguShell";
import LguDashboardView from "../../features/lguDashboard/components/LguDashboardView";
import { useLguDashboard } from "../../features/lguDashboard/hooks/useLguDashboard";

export default function LguDashboard() {
  const {
    loading,
    error,
    refetch,
    stats,
    statsSyncing,
    statsError,
    pins,
    recent,
    hazardZones,
    hazardsLoading,
    hazardsError,
  } =
    useLguDashboard();

  return (
    <LguShell title="Dashboard" subtitle="Live emergency coordination">
      <LguDashboardView
        loading={loading}
        error={error}
        onRefresh={() => void refetch()}
        stats={stats}
        statsSyncing={statsSyncing}
        statsError={statsError}
        pins={pins}
        recent={recent}
        hazardZones={hazardZones}
        hazardsLoading={hazardsLoading}
        hazardsError={hazardsError}
      />
    </LguShell>
  );
}
