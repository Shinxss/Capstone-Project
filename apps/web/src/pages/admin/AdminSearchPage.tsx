import AdminShell from "@/components/admin/AdminShell";
import SearchResultsView from "@/features/globalSearch/components/SearchResultsView";

export default function AdminSearchPage() {
  return (
    <AdminShell
      title="Global Search"
      subtitle="City-wide query across incident reports, personnel, tasks, and master records"
    >
      <SearchResultsView portalPathPrefix="/admin" />
    </AdminShell>
  );
}
