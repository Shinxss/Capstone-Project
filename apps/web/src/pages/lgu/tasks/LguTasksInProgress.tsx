import LguShell from "../../../components/lgu/LguShell";
import LguTasksInProgressView from "../../../features/tasks/components/LguTasksInProgressView";
import { useLguTasksInProgress } from "../../../features/tasks/hooks/useLguTasksInProgress";

export default function LguTasksInProgress() {
  const vm = useLguTasksInProgress();

  return (
    <LguShell title="Tasks" subtitle="Emergencies currently being responded to">
      <LguTasksInProgressView {...vm} loading={vm.loading} error={vm.error} onRefresh={vm.refetch} />
    </LguShell>
  );
}
