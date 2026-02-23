import AdminShell from "@/components/admin/AdminShell";
import AdminAuditTrailsView from "@/features/auditTrails/components/AdminAuditTrailsView";
import { useAdminAuditTrails } from "@/features/auditTrails/hooks/useAdminAuditTrails";

export default function AdminAuditTrails() {
  const vm = useAdminAuditTrails();

  return (
    <AdminShell title="Logs & Audit Trails" subtitle="Trace system activity, security events, and critical changes">
      <AdminAuditTrailsView {...vm} />
    </AdminShell>
  );
}
