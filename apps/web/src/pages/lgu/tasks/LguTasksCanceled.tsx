import LguShell from "../../../components/lgu/LguShell";
import LguTasksCanceledView from "../../../features/tasks/components/LguTasksCanceledView";
import { useLguTasksCanceled } from "../../../features/tasks/hooks/useLguTasksCanceled";

export default function LguTasksCanceled() {
  const vm = useLguTasksCanceled();

  return (
    <LguShell title="Tasks" subtitle="Canceled dispatch offers and archived items">
      <LguTasksCanceledView {...vm} loading={vm.loading} error={vm.error} onRefresh={vm.refetch} />
    </LguShell>
  );
}
