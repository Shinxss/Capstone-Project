import LguShell from "../../../components/lgu/LguShell";
import LguTasksForReviewView from "../../../features/tasks/components/LguTasksForReviewView";
import { useLguTasksForReview } from "../../../features/tasks/hooks/useLguTasksForReview";

export default function LguTasksForReview() {
  const vm = useLguTasksForReview();

  return (
    <LguShell title="Tasks" subtitle="Volunteer-completed emergencies awaiting LGU verification">
      <LguTasksForReviewView {...vm} loading={vm.loading} error={vm.error} onRefresh={vm.refetch} />
    </LguShell>
  );
}
