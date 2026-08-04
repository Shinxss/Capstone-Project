import LguShell from "../../../components/lgu/LguShell";
import LguTasksCompletedView from "../../../features/tasks/components/LguTasksCompletedView";
import { useLguTasksCompleted } from "../../../features/tasks/hooks/useLguTasksCompleted";

export default function LguTasksCompleted() {
  const vm = useLguTasksCompleted();

  return (
    <LguShell title="Tasks" subtitle="Emergency dispatch operations">
      <LguTasksCompletedView {...vm} />
    </LguShell>
  );
}
