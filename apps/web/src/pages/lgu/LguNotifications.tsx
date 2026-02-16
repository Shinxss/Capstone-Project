import LguShell from "../../components/lgu/LguShell";
import LguNotificationsView from "../../features/notifications/components/LguNotificationsView";
import { useLguNotifications } from "../../features/notifications/hooks/useLguNotifications";

export default function LguNotifications() {
  const vm = useLguNotifications();

  return (
    <LguShell title="Notifications" subtitle="Task updates, emergencies, verification needed, announcements">
      <LguNotificationsView {...vm} loading={vm.loading} error={vm.error} onRefresh={vm.refresh} />
    </LguShell>
  );
}
