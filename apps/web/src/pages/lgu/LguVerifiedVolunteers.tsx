import LguShell from "../../components/lgu/LguShell";
import LguVerifiedVolunteersView from "../../features/volunteer/components/LguVerifiedVolunteersView";
import { useLguVerifiedVolunteers } from "../../features/volunteer/hooks/useLguVerifiedVolunteers";

export default function LguVerifiedVolunteers() {
  const vm = useLguVerifiedVolunteers();

  return (
    <LguShell title="Volunteers" subtitle="Verified Volunteers">
      <LguVerifiedVolunteersView {...vm} loading={vm.loading} error={vm.listError} onRefresh={vm.refresh} />
    </LguShell>
  );
}
