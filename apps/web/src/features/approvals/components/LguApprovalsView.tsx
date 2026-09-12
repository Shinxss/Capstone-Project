import { useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { EmergencyApprovalItem } from "../models/approvals.types";
import { useLguApprovals } from "../hooks/useLguApprovals";
import ApprovalFilters from "./ApprovalFilters";
import ApprovalRejectModal from "./ApprovalRejectModal";
import ApprovalReportCard from "./ApprovalReportCard";
import ApprovalStats from "./ApprovalStats";

type Props = ReturnType<typeof useLguApprovals> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function ApprovalListSkeleton() {
  return (
    <div className="space-y-2" aria-label="Loading emergency reports">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="h-[108px] animate-pulse rounded-xl border border-slate-200 bg-white p-3 dark:border-[#1C2940] dark:bg-[#0B1220]">
          <div className="flex h-full gap-4">
            <div className="w-36 rounded-lg bg-slate-100 dark:bg-[#18243A]" />
            <div className="flex-1 space-y-3 py-2">
              <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-[#18243A]" />
              <div className="h-2.5 w-1/2 rounded bg-slate-100 dark:bg-[#18243A]" />
              <div className="h-2.5 w-3/4 rounded bg-slate-100 dark:bg-[#18243A]" />
            </div>
          </div>
        </div>
      ))}
    </div>
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

  return (
    <div className="min-h-full bg-slate-50 px-5 py-4 text-slate-900 dark:bg-[#060C18] dark:text-slate-100 lg:px-6">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <ApprovalStats {...stats} />

        <ApprovalFilters
          filters={filters}
          emergencyTypeOptions={emergencyTypeOptions}
          barangayOptions={barangayOptions}
          onChange={setFilters}
          onClear={clearFilters}
        />

        <section>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Reported Emergencies</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>Showing {filtered.length === 0 ? 0 : `1–${filtered.length}`} of {filtered.length} reports</span>
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
          ) : loading ? (
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
