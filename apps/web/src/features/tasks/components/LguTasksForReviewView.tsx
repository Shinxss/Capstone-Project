import { ClipboardCheck } from "lucide-react";
import { useLguTasksForReview } from "../hooks/useLguTasksForReview";
import ForReviewDetailsPanel from "./ForReviewDetailsPanel";
import ForReviewQueueRail from "./ForReviewQueueRail";

type Props = ReturnType<typeof useLguTasksForReview> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function LoadingPanel() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
      Loading...
    </div>
  );
}

function ErrorPanel({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200">
      <div className="flex items-center justify-between gap-3">
        <span>{error}</span>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function EmptyDetailsPanel() {
  return (
    <div className="hidden lg:mt-3 lg:flex lg:min-h-0 lg:items-center lg:justify-center lg:bg-white lg:px-3 lg:dark:bg-[#0B1220]">
      <div className="flex w-full max-w-2xl flex-col items-center justify-center px-6 py-10 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-[#0E1626] dark:text-slate-400">
          <ClipboardCheck size={20} />
        </div>
        <div className="mt-3 text-base font-semibold text-gray-900 dark:text-slate-100">No task details yet</div>
        <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-slate-400">
          No dispatches are currently awaiting review. Task details will appear here once a volunteer submission enters the queue.
        </p>
      </div>
    </div>
  );
}

export default function LguTasksForReviewView(props: Props) {
  const { loading, error, onRefresh } = props;

  if (loading) {
    return (
      <div className="pl-4 pr-0 sm:pl-6 sm:pr-0">
        <LoadingPanel />
      </div>
    );
  }
  if (error) {
    return (
      <div className="pl-4 pr-0 sm:pl-6 sm:pr-0">
        <ErrorPanel error={error} onRetry={onRefresh} />
      </div>
    );
  }

  if (props.rows.length === 0) {
    return (
      <div className="pl-4 pr-0 sm:pl-6 sm:pr-0 lg:h-full lg:overflow-hidden">
        <div className="grid grid-cols-1 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] xl:grid-cols-[minmax(0,1fr)_minmax(380px,430px)]">
          <EmptyDetailsPanel />
          <div className="lg:min-h-0 lg:overflow-y-auto lg:bg-white lg:dark:bg-[#0B1220] for-review-panel-scroll">
            <ForReviewQueueRail
              totalCount={props.rows.length}
              items={props.filteredRows}
              selectedTaskId={props.selectedTaskId}
              verifyingId={props.verifyingId}
              onSelectTask={props.onSelectTask}
              search={props.search}
              onSearchChange={props.setSearch}
              emergencyType={props.emergencyType}
              emergencyTypeOptions={props.emergencyTypeOptions}
              onEmergencyTypeChange={props.setEmergencyType}
              barangay={props.barangay}
              barangayOptions={props.barangayOptions}
              onBarangayChange={props.setBarangay}
              date={props.date}
              onDateChange={props.setDate}
              sort={props.sort}
              onSortChange={props.setSort}
              missingProofOnly={props.missingProofOnly}
              onMissingProofOnlyChange={props.setMissingProofOnly}
              onClearFilters={props.clearFilters}
              hasActiveFilters={props.hasActiveFilters}
              activeFilterBadges={props.activeFilterBadges}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pl-4 pr-0 sm:pl-6 sm:pr-0 lg:h-full lg:overflow-hidden">
      <div className="grid grid-cols-1 gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,420px)] xl:grid-cols-[minmax(0,1.55fr)_minmax(380px,430px)]">
        <div className="order-2 lg:order-1 lg:mt-3 lg:min-h-0 lg:overflow-y-auto lg:bg-white lg:pr-1 lg:dark:bg-[#0B1220] for-review-panel-scroll">
          <ForReviewDetailsPanel
            selectedTask={props.selectedTask}
            selectedQueueItem={props.selectedQueueItem}
            verifyingId={props.verifyingId}
            verifyError={props.verifyError}
            onVerify={props.onVerify}
            checklist={props.checklist}
            reviewerNotes={props.reviewerNotes}
            onReviewerNotesChange={props.setReviewerNotes}
            selectedProofs={props.selectedProofs}
            activeProofIndex={props.activeProofIndex}
            onSelectProofIndex={props.onSelectProofIndex}
            proofLoading={props.proofLoading}
            proofError={props.proofError}
            proofObjectUrl={props.proofObjectUrl}
            proofPreviewUrls={props.proofPreviewUrls}
            onDownloadProof={props.downloadProof}
          />
        </div>

        <div className="order-1 lg:order-2 lg:min-h-0 lg:overflow-y-auto lg:bg-white lg:dark:bg-[#0B1220] for-review-panel-scroll">
          <ForReviewQueueRail
            totalCount={props.rows.length}
            items={props.filteredRows}
            selectedTaskId={props.selectedTaskId}
            verifyingId={props.verifyingId}
            onSelectTask={props.onSelectTask}
            search={props.search}
            onSearchChange={props.setSearch}
            emergencyType={props.emergencyType}
            emergencyTypeOptions={props.emergencyTypeOptions}
            onEmergencyTypeChange={props.setEmergencyType}
            barangay={props.barangay}
            barangayOptions={props.barangayOptions}
            onBarangayChange={props.setBarangay}
            date={props.date}
            onDateChange={props.setDate}
            sort={props.sort}
            onSortChange={props.setSort}
            missingProofOnly={props.missingProofOnly}
            onMissingProofOnlyChange={props.setMissingProofOnly}
            onClearFilters={props.clearFilters}
            hasActiveFilters={props.hasActiveFilters}
            activeFilterBadges={props.activeFilterBadges}
          />
        </div>
      </div>
    </div>
  );
}
