import { useMemo, useState } from "react";
import Modal from "../../../components/ui/Modal";
import InlineAlert from "../../../components/ui/InlineAlert";
import type { DispatchTask } from "../../tasks/models/tasks.types";
import { useLguApprovals } from "../hooks/useLguApprovals";

type Props = ReturnType<typeof useLguApprovals> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function StatusPill({ status }: { status: string }) {
  const normalized = String(status || "").toUpperCase();
  const cls =
    normalized === "DONE"
      ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/50"
      : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-[#0E1626] dark:text-slate-200 dark:border-[#162544]";

  return (
    <span className={["inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold", cls].join(" ")}>
      {normalized || "-"}
    </span>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 py-1">
      <div className="text-xs font-semibold text-gray-500 dark:text-slate-400">{label}</div>
      <div className="text-sm break-words text-gray-900 dark:text-slate-100">{value || "-"}</div>
    </div>
  );
}

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
    proofOpen,
    proofLoading,
    proofError,
    proofObjectUrl,
    openProof,
    closeProof,
    downloadProof,
  } = props;

  const rows = useMemo(() => filtered, [filtered]);

  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [selected, setSelected] = useState<DispatchTask | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState("");

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");

  const openEvidence = (task: DispatchTask) => {
    setSelected(task);
    setEvidenceOpen(true);
  };

  if (loading) return <LoadingPanel />;
  if (error) return <ErrorPanel error={error} onRetry={onRefresh} />;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">Pending verification</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">
            Verify or reject completed dispatches. Volunteer verification is not handled here.
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
            placeholder="Dispatch ID, emergency ID, volunteer, barangay..."
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
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Barangay</div>
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
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
          No dispatches pending verification.
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white dark:bg-[#0B1220] dark:border-[#162544]">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-[#0E1626] dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Dispatch</th>
                <th className="px-4 py-3">Emergency</th>
                <th className="px-4 py-3">Barangay</th>
                <th className="px-4 py-3">Reported</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
              {rows.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-[#0E1626]">
                  <td className="px-4 py-3 font-mono text-xs text-gray-800 dark:text-slate-200">{task.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-extrabold text-gray-900 dark:text-slate-100">
                      {String(task.emergency?.emergencyType || "Emergency").toUpperCase()}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">
                      ID: <span className="font-mono">{task.emergency?.id || "-"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{task.emergency?.barangayName || "-"}</td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                    {task.emergency?.reportedAt ? new Date(task.emergency.reportedAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                    {task.completedAt ? new Date(task.completedAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{task.volunteer?.name || "-"}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={task.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEvidence(task)}
                        className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
                      >
                        Evidence
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmId(task.id);
                          setConfirmOpen(true);
                        }}
                        disabled={verifyingId === task.id}
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {verifyingId === task.id ? "Verifying..." : "Verify"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectId(task.id);
                          setRejectReason("");
                          setRejectReasonError("");
                          setRejectOpen(true);
                        }}
                        disabled={rejectingId === task.id}
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
        open={evidenceOpen && !!selected}
        title="Evidence / Details"
        subtitle={selected ? `Dispatch ${selected.id}` : undefined}
        onClose={() => {
          setEvidenceOpen(false);
          setSelected(null);
        }}
        maxWidthClassName="max-w-4xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            {selected ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmId(selected.id);
                    setConfirmOpen(true);
                  }}
                  disabled={verifyingId === selected.id}
                  className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {verifyingId === selected.id ? "Verifying..." : "Verify"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectId(selected.id);
                    setRejectReason("");
                    setRejectReasonError("");
                    setRejectOpen(true);
                  }}
                  disabled={rejectingId === selected.id}
                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Reject
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setEvidenceOpen(false);
                setSelected(null);
              }}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Close
            </button>
          </div>
        }
      >
        {selected ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4 dark:border-[#162544]">
              <div className="mb-2 text-sm font-extrabold text-gray-900 dark:text-slate-100">Dispatch</div>
              <Row label="Dispatch ID" value={selected.id} />
              <Row label="Status" value={String(selected.status || "").toUpperCase()} />
              <Row label="Volunteer" value={selected.volunteer?.name || "-"} />
              <Row label="Completed At" value={selected.completedAt ? new Date(selected.completedAt).toLocaleString() : "-"} />
              <Row label="Reported At" value={selected.emergency?.reportedAt ? new Date(selected.emergency.reportedAt).toLocaleString() : "-"} />
            </div>

            <div className="rounded-xl border border-gray-200 p-4 dark:border-[#162544]">
              <div className="mb-2 text-sm font-extrabold text-gray-900 dark:text-slate-100">Emergency</div>
              <Row label="Emergency ID" value={selected.emergency?.id || "-"} />
              <Row label="Type" value={selected.emergency?.emergencyType || "-"} />
              <Row label="Barangay" value={selected.emergency?.barangayName || "-"} />
              <Row
                label="Location"
                value={`(${Number(selected.emergency?.lat || 0).toFixed(5)}, ${Number(selected.emergency?.lng || 0).toFixed(5)})`}
              />
            </div>

            {selected.emergency?.notes ? (
              <div className="rounded-xl border border-gray-200 p-4 dark:border-[#162544] lg:col-span-2">
                <div className="mb-2 text-sm font-extrabold text-gray-900 dark:text-slate-100">Notes</div>
                <div className="whitespace-pre-wrap text-sm text-gray-800 dark:text-slate-200">{selected.emergency.notes}</div>
              </div>
            ) : null}

            <div className="rounded-xl border border-gray-200 p-4 dark:border-[#162544] lg:col-span-2">
              <div className="mb-2 text-sm font-extrabold text-gray-900 dark:text-slate-100">Attachments</div>
              {selected.proofs && selected.proofs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selected.proofs.map((proof, index) => (
                    <button
                      key={`${proof.url}-${index}`}
                      type="button"
                      onClick={() => void openProof(proof.url, proof.fileName || `proof-${index + 1}`)}
                      className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-100 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
                    >
                      {proof.fileName || `Proof ${index + 1}`}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600 dark:text-slate-300">No attachments uploaded.</div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={confirmOpen && !!confirmId}
        title="Verify Dispatch"
        subtitle="Confirm verification of this completed dispatch"
        onClose={() => {
          setConfirmOpen(false);
          setConfirmId("");
        }}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setConfirmOpen(false);
                setConfirmId("");
              }}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
              disabled={!!verifyingId}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                const id = confirmId;
                setConfirmOpen(false);
                setConfirmId("");
                await verify(id);
              }}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              disabled={!!verifyingId}
            >
              {verifyingId ? "Verifying..." : "Verify"}
            </button>
          </div>
        }
      >
        <div className="text-sm text-gray-700 dark:text-slate-300">
          This will mark the dispatch as verified and finalize the completion audit trail.
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-slate-500">
          Dispatch ID: <span className="font-mono">{confirmId}</span>
        </div>
      </Modal>

      <Modal
        open={rejectOpen && !!rejectId}
        title="Reject Verification"
        subtitle="Provide a reason (required)"
        onClose={() => {
          setRejectOpen(false);
          setRejectId("");
          setRejectReason("");
          setRejectReasonError("");
        }}
        maxWidthClassName="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setRejectOpen(false);
                setRejectId("");
                setRejectReason("");
                setRejectReasonError("");
              }}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
              disabled={!!rejectingId}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                const validation = validateRejectReason(rejectReason);
                if (!validation.ok) {
                  setRejectReasonError(validation.error);
                  return;
                }
                setRejectReasonError("");
                const id = rejectId;
                setRejectOpen(false);
                setRejectId("");
                await reject(id, rejectReason);
              }}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              disabled={!!rejectingId}
            >
              {rejectingId ? "Rejecting..." : "Reject"}
            </button>
          </div>
        }
      >
        <div className="text-xs text-gray-500 dark:text-slate-500">
          Dispatch ID: <span className="font-mono">{rejectId}</span>
        </div>
        <div className="mt-3">
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Reason</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="mt-1 min-h-24 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100 dark:placeholder:text-slate-500"
            placeholder="Explain why this dispatch verification is rejected..."
          />
          {rejectReasonError ? <div className="mt-1 text-sm text-red-600 dark:text-red-300">{rejectReasonError}</div> : null}
        </div>
        <div className="mt-2 text-[11px] text-gray-500 dark:text-slate-500">
          Note: If the backend reject endpoint is not implemented, the rejection is stored locally (UI-only) and removed from the list.
        </div>
      </Modal>

      <Modal
        open={proofOpen}
        title="Proof Preview"
        subtitle="Secure preview (LGU/Admin only)"
        onClose={closeProof}
        maxWidthClassName="max-w-5xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={downloadProof}
              disabled={!proofObjectUrl}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Download
            </button>
            <button
              type="button"
              onClick={closeProof}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        }
      >
        {proofLoading ? <div className="text-sm text-gray-600 dark:text-slate-300">Loading proof...</div> : null}
        {proofError ? (
          <InlineAlert variant="error" title="Proof">
            {proofError}
          </InlineAlert>
        ) : null}
        {!proofLoading && !proofError && proofObjectUrl ? (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544]">
            <img src={proofObjectUrl} alt="Proof" className="max-h-[75vh] w-full object-contain" />
          </div>
        ) : null}
      </Modal>
    </>
  );
}

