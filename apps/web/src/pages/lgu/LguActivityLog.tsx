import LguShell from "../../components/lgu/LguShell";
import LguActivityLogView from "../../features/activityLog/components/LguActivityLogView";
import { useLguActivityLog } from "../../features/activityLog/hooks/useLguActivityLog";

export default function LguActivityLog() {
  const vm = useLguActivityLog();

  return (
    <LguShell title="Activity Log" subtitle="Audit trail of LGU actions (UI log)">
      <LguActivityLogView {...vm} loading={vm.loading} error={vm.error} onRefresh={vm.refetch} />
    </LguShell>
  );
}
