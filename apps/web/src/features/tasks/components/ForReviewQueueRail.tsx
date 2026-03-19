import { ClipboardList, SearchX } from "lucide-react";
import type { ForReviewQueueItem, ForReviewSort } from "../hooks/useLguTasksForReview";
import ForReviewFilters from "./ForReviewFilters";
import ForReviewQueueCard from "./ForReviewQueueCard";

type Props = {
  totalCount: number;
  items: ForReviewQueueItem[];
  selectedTaskId: string | null;
  verifyingId: string | null;
  onSelectTask: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  emergencyType: string;
  emergencyTypeOptions: string[];
  onEmergencyTypeChange: (value: string) => void;
  barangay: string;
  barangayOptions: string[];
  onBarangayChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  sort: ForReviewSort;
  onSortChange: (value: ForReviewSort) => void;
  missingProofOnly: boolean;
  onMissingProofOnlyChange: (value: boolean) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterBadges: string[];
};

export default function ForReviewQueueRail({
  totalCount,
  items,
  selectedTaskId,
  verifyingId,
  onSelectTask,
  search,
  onSearchChange,
  emergencyType,
  emergencyTypeOptions,
  onEmergencyTypeChange,
  barangay,
  barangayOptions,
  onBarangayChange,
  date,
  onDateChange,
  sort,
  onSortChange,
  missingProofOnly,
  onMissingProofOnlyChange,
  onClearFilters,
  hasActiveFilters,
  activeFilterBadges,
}: Props) {
  const isQueueEmpty = totalCount === 0;

  return (
    <aside className="space-y-3 px-3 pb-4 pt-3">
      <div className="px-1 py-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-slate-100">
              <ClipboardList size={20} />
              Review Queue
            </div>
            <div className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">Tasks awaiting LGU verification</div>
          </div>
          <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700 dark:border-[#22365D] dark:bg-[#101A30] dark:text-slate-200">
            {items.length} item{items.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="px-1">
        <ForReviewFilters
          search={search}
          onSearchChange={onSearchChange}
          emergencyType={emergencyType}
          emergencyTypeOptions={emergencyTypeOptions}
          onEmergencyTypeChange={onEmergencyTypeChange}
          barangay={barangay}
          barangayOptions={barangayOptions}
          onBarangayChange={onBarangayChange}
          date={date}
          onDateChange={onDateChange}
          sort={sort}
          onSortChange={onSortChange}
          missingProofOnly={missingProofOnly}
          onMissingProofOnlyChange={onMissingProofOnlyChange}
          onClearFilters={onClearFilters}
          hasActiveFilters={hasActiveFilters}
          activeFilterBadges={activeFilterBadges}
        />
      </div>

      <div className="px-1">
        <div className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
          {items.length === totalCount ? `${totalCount} in queue` : `${items.length} filtered of ${totalCount}`}
        </div>

        {items.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-4 text-center">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-[#0E1626] dark:text-slate-400">
              <SearchX size={18} />
            </div>
            <div className="text-sm font-semibold text-gray-800 dark:text-slate-200">
              {isQueueEmpty ? "No tasks awaiting review" : "No tasks match your filters"}
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              {isQueueEmpty
                ? "Completed tasks with proof uploads will appear here once volunteers submit them."
                : "Try adjusting search or clearing filters."}
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-1" aria-label="Review queue list">
            {items.map((item) => (
              <ForReviewQueueCard
                key={item.taskId}
                item={item}
                selected={selectedTaskId === item.taskId}
                verifying={verifyingId === item.taskId}
                onSelect={() => onSelectTask(item.taskId)}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
