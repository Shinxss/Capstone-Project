import AdminShell from "@/components/admin/AdminShell";
import LguProfileView from "@/features/profile/components/LguProfileView";
import { useLguProfile } from "@/features/profile/hooks/useLguProfile";

export default function AdminProfile() {
  const vm = useLguProfile();

  return (
    <AdminShell title="Profile" subtitle="Account profile details">
      <LguProfileView {...vm} loading={vm.loading} error={vm.error} onRefresh={vm.refresh} />
    </AdminShell>
  );
}
