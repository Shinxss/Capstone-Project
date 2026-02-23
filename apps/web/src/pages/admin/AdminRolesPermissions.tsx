import { Navigate } from "react-router-dom";
import AdminShell from "@/components/admin/AdminShell";
import { useLguSession } from "@/features/auth/hooks/useLguSession";
import AdminRolesPermissionsView from "@/features/rbac/components/AdminRolesPermissionsView";
import { useAdminRolesPermissions } from "@/features/rbac/hooks/useAdminRolesPermissions";

export default function AdminRolesPermissions() {
  const { user } = useLguSession();
  const vm = useAdminRolesPermissions();

  if (user?.adminTier !== "SUPER") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <AdminShell title="Roles & Permissions" subtitle="Configure role profile permission matrix">
      <AdminRolesPermissionsView {...vm} />
    </AdminShell>
  );
}
