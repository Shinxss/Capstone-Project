import { Navigate } from "react-router-dom";
import AdminShell from "@/components/admin/AdminShell";
import { useLguSession } from "@/features/auth/hooks/useLguSession";
import AdminMasterDataView from "@/features/masterData/components/AdminMasterDataView";
import { useAdminMasterData } from "@/features/masterData/hooks/useAdminMasterData";

export default function AdminMasterData() {
  const { user } = useLguSession();
  const vm = useAdminMasterData();

  if (user?.adminTier !== "SUPER") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <AdminShell title="Master Data" subtitle="Maintain emergency, severity, template, and workflow definitions">
      <AdminMasterDataView {...vm} />
    </AdminShell>
  );
}
