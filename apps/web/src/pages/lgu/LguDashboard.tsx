import LguShell from "../../components/lgu/LguShell";
import LguDashboardView from "../../features/lguDashboard/components/LguDashboardView";
import { useLguDashboard } from "../../features/lguDashboard/hooks/useLguDashboard";

export default function LguDashboard() {
  const { loading, error, refetch, stats, pins, recent } = useLguDashboard();

  return (
    <LguShell title="Dashboard" subtitle="Live emergency coordination">
      <LguDashboardView
        loading={loading}
        error={error}
        onRefresh={refetch}
        stats={stats}
        pins={pins}
        recent={recent}
      />
    </LguShell>
  );
}
