import { Navigate } from "react-router-dom";
import AdminShell from "@/components/admin/AdminShell";
import { useLguSession } from "@/features/auth/hooks/useLguSession";
import AdminBarangaysCoverageView from "@/features/adminBarangays/components/AdminBarangaysCoverageView";
import { useAdminBarangays } from "@/features/adminBarangays/hooks/useAdminBarangays";

export default function AdminBarangaysCoverage() {
  const { user } = useLguSession();
  const vm = useAdminBarangays();

  if (user?.adminTier !== "SUPER") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <AdminShell title="Barangays & Coverage" subtitle="Manage Dagupan barangay records and boundaries">
      <AdminBarangaysCoverageView {...vm} />
    </AdminShell>
  );
}
