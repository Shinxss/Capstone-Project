import { Navigate } from "react-router-dom";
import AdminShell from "@/components/admin/AdminShell";
import AdminUserManagementView from "@/features/adminUsers/components/AdminUserManagementView";
import { useAdminUsers } from "@/features/adminUsers/hooks/useAdminUsers";

export default function AdminUserManagement() {
  const vm = useAdminUsers();

  if (!vm.isSuper) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <AdminShell title="User Management" subtitle="Manage LGU, CDRRMO, volunteer, and community accounts">
      <AdminUserManagementView {...vm} />
    </AdminShell>
  );
}
