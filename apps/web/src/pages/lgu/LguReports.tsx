import LguShell from "../../components/lgu/LguShell";
import LguReportsView from "../../features/reports/components/LguReportsView";
import { useLguReports } from "../../features/reports/hooks/useLguReports";

export default function LguReports() {
  const vm = useLguReports();

  return (
    <LguShell title="Reports" subtitle="Operational summaries (derived)">
      <LguReportsView {...vm} loading={vm.loading} error={vm.error} onRefresh={vm.refresh} />
    </LguShell>
  );
}
