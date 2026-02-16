import LguShell from "../../../components/lgu/LguShell";
import LguTasksCompletedView from "../../../features/tasks/components/LguTasksCompletedView";
import { useLguTasksCompleted } from "../../../features/tasks/hooks/useLguTasksCompleted";

export default function LguTasksCompleted() {
  const vm = useLguTasksCompleted();

  return (
    <LguShell title="Tasks" subtitle="Verified emergency dispatches (completed)">
      <LguTasksCompletedView {...vm} loading={vm.loading} error={vm.error} onRefresh={vm.refetch} />
    </LguShell>
  );
}
