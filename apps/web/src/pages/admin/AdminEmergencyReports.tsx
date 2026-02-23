import AdminShell from "@/components/admin/AdminShell";
import LguEmergenciesView from "@/features/emergency/components/LguEmergenciesView";
import { useLguEmergencies } from "@/features/emergency/hooks/useLguEmergencies";

export default function AdminEmergencyReports() {
  const vm = useLguEmergencies();

  return (
    <AdminShell title="Emergency Reports" subtitle="Monitor and triage active emergency reports">
      <LguEmergenciesView {...vm} loading={vm.loading} error={vm.error} onRefresh={vm.refetch} />
    </AdminShell>
  );
}
