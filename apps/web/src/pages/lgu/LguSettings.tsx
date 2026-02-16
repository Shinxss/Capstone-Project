import LguShell from "../../components/lgu/LguShell";
import LguSettingsView from "../../features/settings/components/LguSettingsView";
import { useLguSettings } from "../../features/settings/hooks/useLguSettings";

export default function LguSettings() {
  const vm = useLguSettings();

  return (
    <LguShell title="Settings" subtitle="Personal and operational preferences">
      <LguSettingsView {...vm} loading={vm.loading} error={vm.error} onRefresh={vm.refresh} />
    </LguShell>
  );
}
