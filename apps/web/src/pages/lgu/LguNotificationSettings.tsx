import LguShell from "../../components/lgu/LguShell";
import LguSettingsView from "../../features/settings/components/LguSettingsView";
import { useLguSettings } from "../../features/settings/hooks/useLguSettings";

export default function LguNotificationSettings() {
  const vm = useLguSettings();

  return (
    <LguShell title="Notification Settings" subtitle="Control web and email notifications by action">
      <LguSettingsView
        {...vm}
        mode="notifications"
        loading={vm.loading}
        error={vm.error}
        onRefresh={vm.refresh}
      />
    </LguShell>
  );
}
