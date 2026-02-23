import AdminShell from "@/components/admin/AdminShell";
import LguNotificationsView from "@/features/notifications/components/LguNotificationsView";
import { useLguNotifications } from "@/features/notifications/hooks/useLguNotifications";

export default function AdminNotifications() {
  const vm = useLguNotifications();

  return (
    <AdminShell title="Notifications" subtitle="Task updates, emergencies, and verification activity">
      <LguNotificationsView {...vm} loading={vm.loading} error={vm.error} onRefresh={vm.refresh} />
    </AdminShell>
  );
}
