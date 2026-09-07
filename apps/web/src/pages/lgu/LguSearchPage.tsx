import LguShell from "@/components/lgu/LguShell";
import SearchResultsView from "@/features/globalSearch/components/SearchResultsView";

export default function LguSearchPage() {
  return (
    <LguShell
      title="Search Result"
      subtitle="Comprehensive query across emergencies, personnel, tasks, and Dagupan locations"
    >
      <SearchResultsView portalPathPrefix="/lgu" />
    </LguShell>
  );
}
