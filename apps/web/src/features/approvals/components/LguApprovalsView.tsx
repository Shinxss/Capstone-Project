import { useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { EmergencyApprovalItem } from "../models/approvals.types";
import { useLguApprovals } from "../hooks/useLguApprovals";
import ApprovalFilters from "./ApprovalFilters";
import ApprovalRejectModal from "./ApprovalRejectModal";
import ApprovalReportCard from "./ApprovalReportCard";
import ApprovalStats from "./ApprovalStats";
import { Skeleton, SkeletonCard, SkeletonRegion, SkeletonStatCard } from "@/components/ui/Skeleton";

type Props = ReturnType<typeof useLguApprovals> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function ApprovalListSkeleton() {
  return (
    <SkeletonRegion label="Loading emergency reports" className="space-y-2">
      {Array.from({ length: 5 }, (_, index) => (
        <SkeletonCard key={index} className="h-[108px] rounded-xl p-3">
          <div className="flex h-full gap-4">
            <Skeleton className="w-36 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-3 py-2">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-2.5 w-1/2" />
              <Skeleton className="h-2.5 w-3/4" />
            </div>
          </div>
        </SkeletonCard>
      ))}
    </SkeletonRegion>
  );
}

export default function LguApprovalsView(props: Props) {
  const navigate = useNavigate();
  const {
    loading,
    error,
    onRefresh,
    filtered,
    stats,
    filters,
    setFilters,
    clearFilters,
    emergencyTypeOptions,
    barangayOptions,
    verify,
    reject,
    validateRejectReason,
    verifyingId,
    rejectingId,
  } = props;
  const [rejectTarget, setRejectTarget] = useState<EmergencyApprovalItem | null>(null);
  const initialLoading = loading && filtered.length === 0;

  return (
    <div className="min-h-full bg-slate-50 px-5 py-4 text-slate-900 dark:bg-[#060C18] dark:text-slate-100 lg:px-6">
      <div className="mx-auto max-w-[1500px] space-y-4">
        {initialLoading ? (
          <SkeletonRegion label="Loading approval statistics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => <SkeletonStatCard key={index} />)}
          </SkeletonRegion>
        ) : <ApprovalStats {...stats} />}

        {initialLoading ? <SkeletonCard className="h-24"><Skeleton className="h-10 w-full" /></SkeletonCard> : <ApprovalFilters
          filters={filters}
          emergencyTypeOptions={emergencyTypeOptions}
          barangayOptions={barangayOptions}
          onChange={setFilters}
          onClear={clearFilters}
        />}

        <section>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Reported Emergencies</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              {initialLoading ? <Skeleton className="h-3 w-36" /> : <span>Showing {filtered.length === 0 ? 0 : `1–${filtered.length}`} of {filtered.length} reports</span>}
              <span className="hidden h-4 w-px bg-slate-200 dark:bg-[#293852] sm:block" />
              <label className="flex items-center gap-2">
                <span>Sort by</span>
                <span className="relative">
                  <select
                    value={filters.sort}
                    onChange={(event) => setFilters((previous) => ({ ...previous, sort: event.target.value as typeof filters.sort }))}
                    className="h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-[#24324A] dark:bg-[#0E1626] dark:text-slate-200 dark:focus:ring-blue-500/20"
                  >
                    <option value="LATEST">Latest First</option>
                    <option value="OLDEST">Oldest First</option>
                    <option value="SEVERITY">Severity</option>
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                </span>
              </label>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              <div className="flex items-center justify-between gap-3">
                <span>{error}</span>
                <button type="button" onClick={onRefresh} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">
                  Retry
                </button>
              </div>
            </div>
          ) : initialLoading ? (
            <ApprovalListSkeleton />
          ) : filtered.length === 0 ? (
            <div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-[#2A3954] dark:bg-[#0B1220]">
              <div>
                <ShieldCheck size={34} className="mx-auto text-slate-400 dark:text-slate-500" />
                <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">No reports found</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Try clearing or adjusting the active filters.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => (
                <ApprovalReportCard
                  key={item.incidentId}
                  item={item}
                  approving={verifyingId === item.incidentId}
                  rejecting={rejectingId === item.incidentId}
                  onView={() => navigate(`/lgu/approvals/${encodeURIComponent(item.incidentId)}`)}
                  onApprove={() => void verify(item.incidentId)}
                  onReject={() => setRejectTarget(item)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <ApprovalRejectModal
        open={Boolean(rejectTarget)}
        busy={Boolean(rejectTarget && rejectingId === rejectTarget.incidentId)}
        validate={validateRejectReason}
        onClose={() => setRejectTarget(null)}
        onConfirm={(reason) => rejectTarget ? reject(rejectTarget.incidentId, reason) : Promise.resolve(false)}
      />
    </div>
  );
}
