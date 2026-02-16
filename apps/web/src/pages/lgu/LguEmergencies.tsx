import LguShell from "../../components/lgu/LguShell";
import LguEmergenciesView from "../../features/emergency/components/LguEmergenciesView";
import { useLguEmergencies } from "../../features/emergency/hooks/useLguEmergencies";

export default function LguEmergencies() {
  const vm = useLguEmergencies();

  return (
    <LguShell title="Emergencies" subtitle="Monitor and manage active emergency situations">
      <LguEmergenciesView {...vm} loading={vm.loading} error={vm.error} onRefresh={vm.refetch} />
    </LguShell>
  );
}
