import { useLguReports } from "../hooks/useLguReports";
import EmergencyBreakdownCard from "./EmergencyBreakdownCard";
import IncidentTrendCard from "./IncidentTrendCard";
import MostAffectedAreasCard from "./MostAffectedAreasCard";
import RecentGeneratedReportsCard from "./RecentGeneratedReportsCard";
import ReportMetricCard from "./ReportMetricCard";
import ReportsErrorState from "./ReportsErrorState";
import ReportsInsightsCard from "./ReportsInsightsCard";
import ReportsLoadingSkeleton from "./ReportsLoadingSkeleton";
import ReportsPageHeader from "./ReportsPageHeader";
import ResponsePerformanceCard from "./ResponsePerformanceCard";

type Props = ReturnType<typeof useLguReports>;

export default function LguReportsView(props: Props) {
  if (props.loading) return <ReportsLoadingSkeleton />;
  if (props.error) return <ReportsErrorState error={props.error} onRetry={props.refresh} />;

  return (
    <div className="px-4 py-4 sm:px-5 lg:px-6">
      <ReportsPageHeader
        barangayName={props.barangayName}
        filters={props.filters}
        setFilters={props.setFilters}
        clearFilters={props.clearFilters}
        emergencyTypeOptions={props.emergencyTypeOptions}
        statusOptions={props.statusOptions}
        onExport={props.exportTasksCsv}
      />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {props.metrics.map((metric) => <ReportMetricCard key={metric.key} metric={metric} />)}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-6"><IncidentTrendCard points={props.incidentTrend} barangayName={props.barangayName} /></div>
        <div className="xl:col-span-6"><ResponsePerformanceCard performance={props.responsePerformance} barangayName={props.barangayName} /></div>
        <div className="xl:col-span-6"><EmergencyBreakdownCard items={props.emergencyBreakdown} /></div>
        <div className="xl:col-span-6"><MostAffectedAreasCard items={props.affectedAreas} /></div>
        <div className="xl:col-span-6"><RecentGeneratedReportsCard reports={props.generatedReports} onDownload={props.exportTasksCsv} /></div>
        <div className="xl:col-span-6"><ReportsInsightsCard insights={props.insights} /></div>
      </div>
    </div>
  );
}
