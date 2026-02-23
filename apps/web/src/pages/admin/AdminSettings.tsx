import AdminShell from "@/components/admin/AdminShell";
import LguSettingsView from "@/features/settings/components/LguSettingsView";
import { useLguSettings } from "@/features/settings/hooks/useLguSettings";

export default function AdminSettings() {
  const vm = useLguSettings();

  return (
    <AdminShell title="Settings" subtitle="Notification and account preferences">
      <LguSettingsView {...vm} loading={vm.loading} error={vm.error} onRefresh={vm.refresh} />
    </AdminShell>
  );
}
