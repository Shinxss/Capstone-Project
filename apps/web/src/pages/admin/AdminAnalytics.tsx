import AdminShell from "@/components/admin/AdminShell";
import AdminAnalyticsView from "@/features/adminAnalytics/components/AdminAnalyticsView";
import { useAdminAnalytics } from "@/features/adminAnalytics/hooks/useAdminAnalytics";

export default function AdminAnalytics() {
  const vm = useAdminAnalytics();

  return (
    <AdminShell title="Analytics & Reports" subtitle="Operational trends and performance metrics">
      <AdminAnalyticsView {...vm} />
    </AdminShell>
  );
}
