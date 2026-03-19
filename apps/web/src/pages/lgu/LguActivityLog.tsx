import LguShell from "../../components/lgu/LguShell";
import LguActivityLogView from "../../features/activityLog/components/LguActivityLogView";
import { useLguActivityLog } from "../../features/activityLog/hooks/useLguActivityLog";

export default function LguActivityLog() {
  const vm = useLguActivityLog();

  return (
    <LguShell title="Activity Log" subtitle="Audit trail of LGU actions from server logs">
      <div className="px-4 py-4 sm:px-6 lg:px-6">
        <LguActivityLogView {...vm} loading={vm.loading} error={vm.error} onRefresh={vm.refetch} />
      </div>
    </LguShell>
  );
}
