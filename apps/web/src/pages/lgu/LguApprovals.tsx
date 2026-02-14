import { useMemo, useState } from "react";
import LguShell from "../../components/lgu/LguShell";
import Modal from "../../components/ui/Modal";
import InlineAlert from "../../components/ui/InlineAlert";
import { useEmergencyVerification } from "../../features/approvals/hooks/useEmergencyVerification";
import type { DispatchTask } from "../../features/tasks/models/tasks.types";

function StatusPill({ status }: { status: string }) {
  const s = String(status || "").toUpperCase();
  const cls =
    s === "DONE"
      ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/50"
      : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-[#0E1626] dark:text-slate-200 dark:border-[#162544]";
  return (
    <span className={["inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold", cls].join(" ")}>
      {s || "-"}
    </span>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 py-1">
      <div className="text-xs font-semibold text-gray-500 dark:text-slate-400">{label}</div>
      <div className="text-sm text-gray-900 dark:text-slate-100 break-words">{value || "-"}</div>
    </div>
  );
}

export default function LguApprovals() {
  const vm = useEmergencyVerification();
  const rows = useMemo(() => vm.filtered, [vm.filtered]);

  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [selected, setSelected] = useState<DispatchTask | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string>("");

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string>("");
  const [rejectReason, setRejectReason] = useState<string>("");
  const [rejectReasonError, setRejectReasonError] = useState<string>("");

  const openEvidence = (t: DispatchTask) => {
    setSelected(t);
    setEvidenceOpen(true);
  };

  return (
    <LguShell title="Approvals / Verification" subtitle="Emergency verification only (dispatch completion)">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">Pending verification</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">
            Verify or reject completed dispatches. Volunteer verification is not handled here.
          </div>
        </div>

        <button
          onClick={vm.refresh}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
        <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Search</div>
          <input
            value={vm.filters.q}
            onChange={(e) => vm.setFilters((p) => ({ ...p, q: e.target.value }))}
            placeholder="Dispatch ID, emergency ID, volunteer, barangay..."
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Emergency type</div>
          <select
            value={vm.filters.emergencyType}
            onChange={(e) => vm.setFilters((p) => ({ ...p, emergencyType: e.target.value }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
          >
            {vm.emergencyTypeOptions.map((t) => (
              <option key={t} value={t}>
                {t === "ALL" ? "All" : t}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Barangay</div>
          <input
            value={vm.filters.barangay}
            onChange={(e) => vm.setFilters((p) => ({ ...p, barangay: e.target.value }))}
            placeholder="Filter barangay"
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Date range</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              type="date"
              value={vm.filters.dateFrom}
              onChange={(e) => vm.setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
              className="w-full rounded-md border border-gray-200 bg-white px-2 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            />
            <input
              type="date"
              value={vm.filters.dateTo}
              onChange={(e) => vm.setFilters((p) => ({ ...p, dateTo: e.target.value }))}
              className="w-full rounded-md border border-gray-200 bg-white px-2 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            />
          </div>
          <div className="mt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={vm.clearFilters}
              className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {vm.loading ? (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
          Loading...
        </div>
      ) : null}

      {vm.error ? (
        <div className="mt-4">
          <InlineAlert variant="error" title="Approvals / Verification">
            {vm.error}
          </InlineAlert>
        </div>
      ) : null}

      {!vm.loading && !vm.error && rows.length === 0 ? (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
          No dispatches pending verification.
        </div>
      ) : null}

      {!vm.loading && !vm.error && rows.length > 0 ? (
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
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-[#0E1626]">
                  <td className="px-4 py-3 font-mono text-xs text-gray-800 dark:text-slate-200">{t.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-extrabold text-gray-900 dark:text-slate-100">
                      {String(t.emergency?.emergencyType || "Emergency").toUpperCase()}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">
                      ID: <span className="font-mono">{t.emergency?.id || "-"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{t.emergency?.barangayName || "-"}</td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                    {t.emergency?.reportedAt ? new Date(t.emergency.reportedAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                    {t.completedAt ? new Date(t.completedAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{t.volunteer?.name || "-"}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEvidence(t)}
                        className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
                      >
                        Evidence
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmId(t.id);
                          setConfirmOpen(true);
                        }}
                        disabled={vm.verifyingId === t.id}
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {vm.verifyingId === t.id ? "Verifying..." : "Verify"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectId(t.id);
                          setRejectReason("");
                          setRejectReasonError("");
                          setRejectOpen(true);
                        }}
                        disabled={vm.rejectingId === t.id}
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
      ) : null}

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
                  disabled={vm.verifyingId === selected.id}
                  className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {vm.verifyingId === selected.id ? "Verifying..." : "Verify"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectId(selected.id);
                    setRejectReason("");
                    setRejectReasonError("");
                    setRejectOpen(true);
                  }}
                  disabled={vm.rejectingId === selected.id}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 p-4 dark:border-[#162544]">
              <div className="text-sm font-extrabold text-gray-900 dark:text-slate-100 mb-2">Dispatch</div>
              <Row label="Dispatch ID" value={selected.id} />
              <Row label="Status" value={String(selected.status || "").toUpperCase()} />
              <Row label="Volunteer" value={selected.volunteer?.name || "-"} />
              <Row label="Completed At" value={selected.completedAt ? new Date(selected.completedAt).toLocaleString() : "-"} />
              <Row label="Reported At" value={selected.emergency?.reportedAt ? new Date(selected.emergency.reportedAt).toLocaleString() : "-"} />
            </div>

            <div className="rounded-xl border border-gray-200 p-4 dark:border-[#162544]">
              <div className="text-sm font-extrabold text-gray-900 dark:text-slate-100 mb-2">Emergency</div>
              <Row label="Emergency ID" value={selected.emergency?.id || "-"} />
              <Row label="Type" value={selected.emergency?.emergencyType || "-"} />
              <Row label="Barangay" value={selected.emergency?.barangayName || "-"} />
              <Row
                label="Location"
                value={`(${Number(selected.emergency?.lat || 0).toFixed(5)}, ${Number(selected.emergency?.lng || 0).toFixed(5)})`}
              />
            </div>

            {selected.emergency?.notes ? (
              <div className="rounded-xl border border-gray-200 p-4 lg:col-span-2 dark:border-[#162544]">
                <div className="text-sm font-extrabold text-gray-900 dark:text-slate-100 mb-2">Notes</div>
                <div className="text-sm text-gray-800 dark:text-slate-200 whitespace-pre-wrap">{selected.emergency.notes}</div>
              </div>
            ) : null}

            <div className="rounded-xl border border-gray-200 p-4 lg:col-span-2 dark:border-[#162544]">
              <div className="text-sm font-extrabold text-gray-900 dark:text-slate-100 mb-2">Attachments</div>
              {selected.proofs && selected.proofs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selected.proofs.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => vm.openProof(p.url, p.fileName || `proof-${idx + 1}`)}
                      className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-100 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
                    >
                      {p.fileName || `Proof ${idx + 1}`}
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
              disabled={!!vm.verifyingId}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                const id = confirmId;
                setConfirmOpen(false);
                setConfirmId("");
                await vm.verify(id);
              }}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              disabled={!!vm.verifyingId}
            >
              {vm.verifyingId ? "Verifying..." : "Verify"}
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
              disabled={!!vm.rejectingId}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                const v = vm.validateRejectReason(rejectReason);
                if (!v.ok) {
                  setRejectReasonError(v.error);
                  return;
                }
                setRejectReasonError("");
                const id = rejectId;
                setRejectOpen(false);
                setRejectId("");
                await vm.reject(id, rejectReason);
              }}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              disabled={!!vm.rejectingId}
            >
              {vm.rejectingId ? "Rejecting..." : "Reject"}
            </button>
          </div>
        }
      >
        <div className="text-xs text-gray-500 dark:text-slate-500">
          Dispatch ID: <span className="font-mono">{rejectId}</span>
        </div>
        <div className="mt-3">
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">
            Reason
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="mt-1 w-full min-h-24 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100 dark:placeholder:text-slate-500"
            placeholder="Explain why this dispatch verification is rejected..."
          />
          {rejectReasonError ? (
            <div className="mt-1 text-sm text-red-600 dark:text-red-300">{rejectReasonError}</div>
          ) : null}
        </div>
        <div className="mt-2 text-[11px] text-gray-500 dark:text-slate-500">
          Note: If the backend reject endpoint is not implemented, the rejection is stored locally (UI-only) and removed from the list.
        </div>
      </Modal>

      <Modal
        open={vm.proofOpen}
        title="Proof Preview"
        subtitle="Secure preview (LGU/Admin only)"
        onClose={vm.closeProof}
        maxWidthClassName="max-w-5xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={vm.downloadProof}
              disabled={!vm.proofObjectUrl}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Download
            </button>
            <button
              type="button"
              onClick={vm.closeProof}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        }
      >
        {vm.proofLoading ? (
          <div className="text-sm text-gray-600 dark:text-slate-300">Loading proof...</div>
        ) : null}
        {vm.proofError ? (
          <InlineAlert variant="error" title="Proof">
            {vm.proofError}
          </InlineAlert>
        ) : null}

        {!vm.proofLoading && !vm.proofError && vm.proofObjectUrl ? (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544]">
            <img src={vm.proofObjectUrl} alt="Proof" className="max-h-[75vh] w-full object-contain" />
          </div>
        ) : null}
      </Modal>
    </LguShell>
  );
}

