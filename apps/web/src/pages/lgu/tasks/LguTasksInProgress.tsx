import LguShell from "../../../components/lgu/LguShell";
import LguTasksInProgressView from "../../../features/tasks/components/LguTasksInProgressView";
import { useLguTasksInProgress } from "../../../features/tasks/hooks/useLguTasksInProgress";

export default function LguTasksInProgress() {
  const vm = useLguTasksInProgress();

  return (
    <LguShell title="Tasks" subtitle="Monitor accepted dispatches and responder progress">
      <LguTasksInProgressView {...vm} />
    </LguShell>
  );
}
