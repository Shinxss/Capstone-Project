import { useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";
import type { DispatchTask } from "../../tasks/models/tasks.types";
import DispatchConfirmationDialog from "../dispatch/components/DispatchConfirmationDialog";
import DispatchDrawerHeader from "../dispatch/components/DispatchDrawerHeader";
import DispatchFilters from "../dispatch/components/DispatchFilters";
import DispatchRespondersEmptyState from "../dispatch/components/DispatchRespondersEmptyState";
import DispatchRespondersSkeleton from "../dispatch/components/DispatchRespondersSkeleton";
import ResponderCard from "../dispatch/components/ResponderCard";
import SelectedRespondersSummary from "../dispatch/components/SelectedRespondersSummary";
import { useDispatchResponderFilters } from "../dispatch/hooks/useDispatchResponderFilters";
import type { PresenceConnectionState } from "../dispatch/types/dispatchResponders.types";
import type { LguEmergencyDetails, Volunteer } from "../models/lguLiveMap.types";

type Props = {
  open: boolean;
  emergency: LguEmergencyDetails | null;
  volunteers: Volunteer[];
  tasks: DispatchTask[];
  selectedIds: string[];
  loading: boolean;
  error: string | null;
  connectionState: PresenceConnectionState;
  onToggle: (volunteerId: string) => void;
  onClearSelection: () => void;
  onRetry: () => void;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
};

function DispatchRespondersDrawer({
  emergency,
  volunteers,
  tasks,
  selectedIds,
  loading,
  error,
  connectionState,
  onToggle,
  onClearSelection,
  onRetry,
  onClose,
  onConfirm,
}: Omit<Props, "open" | "emergency"> & { emergency: LguEmergencyDetails }) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const submissionLockRef = useRef(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const filters = useDispatchResponderFilters({ emergency, volunteers, tasks, selectedIds });

  const closeSafely = () => {
    if (!submitting) onClose();
  };

  const submit = async () => {
    if (submissionLockRef.current || !filters.selectionIsValid || filters.selectedResponders.length === 0) return;
    submissionLockRef.current = true;
    setSubmitting(true);
    setSubmissionError(null);
    const success = await onConfirm();
    if (!success) {
      setSubmissionError("The dispatch could not be completed. Availability may have changed; review the selection and try again.");
      setSubmitting(false);
      submissionLockRef.current = false;
      return;
    }
    setConfirmationOpen(false);
    submissionLockRef.current = false;
  };

  return (
    <DialogPrimitive.Root open onOpenChange={(nextOpen) => { if (!nextOpen) closeSafely(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/20 backdrop-blur-[1px]" />
        <DialogPrimitive.Content
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            closeButtonRef.current?.focus();
          }}
          onEscapeKeyDown={(event) => {
            if (submitting || confirmationOpen) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (submitting || confirmationOpen) event.preventDefault();
          }}
          className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl outline-none dark:border-[#1D2B43] dark:bg-[#08101D] sm:w-[min(760px,calc(100vw-2rem))]"
        >
        <DialogPrimitive.Title className="sr-only">Dispatch Responders</DialogPrimitive.Title>
        <DispatchDrawerHeader emergency={filters.emergencyContext} connectionState={connectionState} onClose={closeSafely} closeButtonRef={closeButtonRef} />

        {loading ? (
          <>
            <div className="shrink-0 space-y-3 border-b border-slate-200 p-4 dark:border-[#1D2B43] sm:p-6"><div className="flex gap-2">{Array.from({ length: 4 }, (_, index) => <span key={index} className="h-9 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-[#1C2A43]" />)}</div><span className="block h-11 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-[#1C2A43]" /></div>
            <div className="min-h-0 flex-1 overflow-y-auto"><DispatchRespondersSkeleton /></div>
          </>
        ) : error ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"><AlertTriangle size={25} /></div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Responders could not be loaded</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">Check the connection and try again. No dispatch request has been sent.</p>
            <button type="button" onClick={onRetry} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"><RefreshCw size={15} />Retry</button>
          </div>
        ) : (
          <>
            <DispatchFilters {...filters} onFilterChange={filters.setActiveFilter} onSearchChange={filters.setSearchQuery} onSortChange={filters.setSortBy} />
            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 dark:bg-[#08101D]">
              {filters.availableCount === 0 && filters.responders.length > 0 ? (
                <div className="mx-4 mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 sm:mx-6"><ShieldAlert size={16} className="shrink-0" /><span>No responders are currently available for dispatch. Unavailable responders are shown for reference.</span></div>
              ) : null}
              {filters.visibleResponders.length === 0 ? (
                <DispatchRespondersEmptyState noAvailable={filters.availableCount === 0} hasActiveFilters={filters.hasActiveFilters} onClearFilters={filters.clearFilters} />
              ) : (
                <div className="space-y-3 p-4 sm:p-6">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400"><span><strong className="text-slate-800 dark:text-slate-200">{filters.visibleResponders.length}</strong> responders</span><span>Only available responders can be selected</span></div>
                  {filters.visibleResponders.map((responder, index) => <ResponderCard key={responder.id} responder={responder} rankedIndex={index} selected={selectedIds.includes(responder.id)} onToggle={onToggle} />)}
                </div>
              )}
            </div>
            <SelectedRespondersSummary selectedResponders={filters.selectedResponders} selectionIsValid={filters.selectionIsValid} emergencyDispatchable={filters.emergencyContext.dispatchable} submitting={submitting} onClear={onClearSelection} onCancel={closeSafely} onDispatch={() => { setSubmissionError(null); setConfirmationOpen(true); }} />
          </>
        )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>

      <DispatchConfirmationDialog open={confirmationOpen} emergency={filters.emergencyContext} responders={filters.selectedResponders} submitting={submitting} error={submissionError} onOpenChange={(nextOpen) => { setSubmissionError(null); setConfirmationOpen(nextOpen); }} onConfirm={() => void submit()} />
    </DialogPrimitive.Root>
  );
}

export default function DispatchRespondersModal(props: Props) {
  if (!props.open || !props.emergency) return null;
  return <DispatchRespondersDrawer {...props} emergency={props.emergency} />;
}
