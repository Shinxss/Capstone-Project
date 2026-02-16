import LguShell from "../../components/lgu/LguShell";
import LguApplicantsView from "../../features/volunteer/components/LguApplicantsView";
import { useLguApplicants } from "../../features/volunteer/hooks/useLguApplicants";

export default function LguApplicants() {
  const vm = useLguApplicants();

  return (
    <LguShell title="Volunteers" subtitle="Applicants (Pending LGU Verification)">
      <LguApplicantsView {...vm} loading={vm.loading} error={vm.listError} onRefresh={vm.refresh} />
    </LguShell>
  );
}
