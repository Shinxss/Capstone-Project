
import InProgressEmergencyCard from "../in-progress/components/InProgressEmergencyCard";
import InProgressTaskDetailsModal from "../in-progress/components/InProgressTaskDetailsModal";
import InProgressTaskFilters from "../in-progress/components/InProgressTaskFilters";
import InProgressTaskPagination from "../in-progress/components/InProgressTaskPagination";
import InProgressTaskStats from "../in-progress/components/InProgressTaskStats";
import { InProgressTasksEmptyState, InProgressTasksErrorState, InProgressTasksSkeleton } from "../in-progress/components/InProgressTaskStates";

import { useLguTasksInProgress } from "../hooks/useLguTasksInProgress";

type Props = ReturnType<typeof useLguTasksInProgress>;

export default function LguTasksInProgressView(props: Props) {
  return (
    <div className="mx-auto w-full max-w-[1680px] space-y-5 px-4 py-5 sm:px-6 sm:py-6">

      {props.loading ? <InProgressTasksSkeleton /> : (
        <>
          <InProgressTaskStats stats={props.stats} />
          <InProgressTaskFilters filters={props.filters} options={props.filterOptions} sort={props.sort} filtersActive={props.filtersActive} onFilterChange={props.updateFilter} onSortChange={props.changeSort} onClear={props.clearFilters} />



          {props.error ? <InProgressTasksErrorState onRetry={props.refresh} /> : props.groups.length === 0 ? <InProgressTasksEmptyState filtersActive={props.filtersActive} onClear={props.clearFilters} /> : (
            <div className="space-y-3">{props.groups.map((group) => <InProgressEmergencyCard key={group.id} group={group} referenceTime={props.referenceTime} onViewDetails={props.setSelectedGroup} />)}</div>
          )}

          {!props.error ? <InProgressTaskPagination pagination={props.pagination} onPageChange={props.setPage} /> : null}
        </>
      )}

      <InProgressTaskDetailsModal group={props.selectedGroup} onClose={() => props.setSelectedGroup(null)} />
    </div>
  );
}
