import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import EmptyState from "../../../components/ui/EmptyState";
import { useLguApprovals } from "../hooks/useLguApprovals";
import type { EmergencyApprovalItem } from "../models/approvals.types";

type Props = ReturnType<typeof useLguApprovals> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function LoadingPanel() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
      Loading...
    </div>
  );
}

function ErrorPanel({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:border-red-500/25 dark:text-red-200">
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

function rowLocation(row: EmergencyApprovalItem) {
  return row.locationLabel?.trim() || row.barangay || "-";
}

export default function LguApprovalsView(props: Props) {
  const {
    loading,
    error,
    onRefresh,
    filtered,
    filters,
    setFilters,
    clearFilters,
    emergencyTypeOptions,
    verify,
    reject,
    validateRejectReason,
    verifyingId,
    rejectingId,
  } = props;

  const rows = useMemo(() => filtered, [filtered]);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");

  if (loading) return <LoadingPanel />;
  if (error) return <ErrorPanel error={error} onRetry={onRefresh} />;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">Pending non-SOS emergency reports</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">
            Approve to publish on live map, or reject with a reason.
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
        <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Search</div>
          <input
            value={filters.q}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
            placeholder="Reference no, type, barangay, reporter..."
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Emergency type</div>
          <select
            value={filters.emergencyType}
            onChange={(e) => setFilters((prev) => ({ ...prev, emergencyType: e.target.value }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
          >
            {emergencyTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type === "ALL" ? "All" : type}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Barangay / Location</div>
          <input
            value={filters.barangay}
            onChange={(e) => setFilters((prev) => ({ ...prev, barangay: e.target.value }))}
            placeholder="Filter barangay"
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Date range</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full rounded-md border border-gray-200 bg-white px-2 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
              className="w-full rounded-md border border-gray-200 bg-white px-2 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            />
          </div>
          <div className="mt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState className="mt-4" icon={ShieldCheck} title="No pending emergency reports." />
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white dark:bg-[#0B1220] dark:border-[#162544]">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-[#0E1626] dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Reference No</th>
                <th className="px-4 py-3">Emergency Type</th>
                <th className="px-4 py-3">Barangay / Location</th>
                <th className="px-4 py-3">Date/Time Reported</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
              {rows.map((row) => (
                <tr key={row.incidentId} className="hover:bg-gray-50 dark:hover:bg-[#0E1626]">
                  <td className="px-4 py-3 font-mono text-xs text-gray-800 dark:text-slate-200">{row.referenceNumber}</td>
                  <td className="px-4 py-3 font-semibold uppercase text-gray-900 dark:text-slate-100">{row.type}</td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{rowLocation(row)}</td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void verify(row.incidentId)}
                        disabled={verifyingId === row.incidentId}
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {verifyingId === row.incidentId ? "Approving..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectId(row.incidentId);
                          setRejectReason("");
                          setRejectReasonError("");
                          setRejectOpen(true);
                        }}
                        disabled={rejectingId === row.incidentId}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={rejectOpen && !!rejectId}
        title="Reject Emergency Report"
        subtitle="Reason is required"
        onClose={() => {
          setRejectOpen(false);
          setRejectId("");
          setRejectReason("");
          setRejectReasonError("");
        }}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
              onClick={() => {
                setRejectOpen(false);
                setRejectId("");
                setRejectReason("");
                setRejectReasonError("");
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={rejectingId === rejectId}
              onClick={async () => {
                const validation = validateRejectReason(rejectReason);
                if (!validation.ok) {
                  setRejectReasonError(validation.error);
                  return;
                }

                setRejectReasonError("");
                await reject(rejectId, rejectReason);
                setRejectOpen(false);
                setRejectId("");
                setRejectReason("");
              }}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {rejectingId === rejectId ? "Rejecting..." : "Reject"}
            </button>
          </div>
        }
      >
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800 dark:text-slate-200">Reason</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            placeholder="Provide a clear reason for rejection"
          />
          {rejectReasonError ? <p className="text-xs text-red-600">{rejectReasonError}</p> : null}
        </div>
      </Modal>
    </>
  );
}
