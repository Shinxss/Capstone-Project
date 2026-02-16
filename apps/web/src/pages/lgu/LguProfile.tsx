import LguShell from "../../components/lgu/LguShell";
import LguProfileView from "../../features/profile/components/LguProfileView";
import { useLguProfile } from "../../features/profile/hooks/useLguProfile";

export default function LguProfile() {
  const vm = useLguProfile();

  return (
    <LguShell title="Profile" subtitle="LGU staff profile management">
      <LguProfileView {...vm} loading={vm.loading} error={vm.error} onRefresh={vm.refresh} />
    </LguShell>
  );
}
