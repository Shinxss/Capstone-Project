import { useMemo, useState } from "react";
import LguShell from "../../../components/lgu/LguShell";
import Modal from "../../../components/ui/Modal";
import InlineAlert from "../../../components/ui/InlineAlert";
import { useLguTaskHistory } from "../../../features/tasks/hooks/useLguTaskHistory";
import { useDispatchReassign } from "../../../features/tasks/hooks/useDispatchReassign";
import type { DispatchTask } from "../../../features/tasks/models/tasks.types";

function deriveCancellation(t: DispatchTask) {
  const canceledAt = t.respondedAt || t.updatedAt || "";
  const canceledBy = "System";
  let reason = "Cancelled";
  if (t.respondedAt) reason = "Auto-cancelled (volunteer accepted another dispatch)";
  const originalAssignee = t.volunteer?.name || "Volunteer";
  return { canceledAt, canceledBy, reason, originalAssignee };
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 py-1">
      <div className="text-xs font-semibold text-gray-500 dark:text-slate-400">{label}</div>
      <div className="text-sm text-gray-900 dark:text-slate-100 break-words">{value || "-"}</div>
    </div>
  );
}

export default function LguTasksCanceled() {
  const vm = useLguTaskHistory("CANCELLED");
  const reassign = useDispatchReassign();

  const [selected, setSelected] = useState<DispatchTask | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const rows = useMemo(() => vm.filtered, [vm.filtered]);

  return (
    <LguShell title="Tasks" subtitle="Canceled dispatch offers and archived items">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">Canceled</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">Track canceled dispatch offers and reassign if needed</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={vm.refetch}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
          >
            Refresh
          </button>
          <button
            onClick={vm.exportCsv}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            disabled={rows.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Date from</div>
          <input
            type="date"
            value={vm.filters.dateFrom}
            onChange={(e) => vm.setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
          />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Date to</div>
          <input
            type="date"
            value={vm.filters.dateTo}
            onChange={(e) => vm.setFilters((p) => ({ ...p, dateTo: e.target.value }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
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

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={vm.clearFilters}
              className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Clear filters
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
          <InlineAlert variant="error" title="Tasks (Canceled)">
            {vm.error}
          </InlineAlert>
        </div>
      ) : null}

      {!vm.loading && !vm.error && rows.length === 0 ? (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
          No canceled tasks found for the selected filters.
        </div>
      ) : null}

      {!vm.loading && !vm.error && rows.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white dark:bg-[#0B1220] dark:border-[#162544]">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-[#0E1626] dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Emergency</th>
                <th className="px-4 py-3">Original assignee</th>
                <th className="px-4 py-3">Canceled at</th>
                <th className="px-4 py-3">Canceled by</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
              {rows.map((t) => {
                const c = deriveCancellation(t);
                return (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-[#0E1626]">
                    <td className="px-4 py-3 font-mono text-xs text-gray-800 dark:text-slate-200">{t.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-extrabold text-gray-900 dark:text-slate-100">
                        {String(t.emergency?.emergencyType || "Emergency").toUpperCase()}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">
                        Barangay: {t.emergency?.barangayName || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-slate-100">
                      {c.originalAssignee}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                      {c.canceledAt ? new Date(c.canceledAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{c.canceledBy}</td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{c.reason}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(t);
                            setDetailsOpen(true);
                          }}
                          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const eid = String(t.emergency?.id || "");
                            if (!eid) return;
                            reassign.openReassign({
                              emergencyId: eid,
                              label: `${t.emergency?.emergencyType || "Emergency"}${t.emergency?.barangayName ? ` • Brgy. ${t.emergency?.barangayName}` : ""}`,
                            });
                          }}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          Reassign
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal
        open={detailsOpen && !!selected}
        title="Canceled Task Details"
        subtitle={selected ? `Dispatch ${selected.id}` : undefined}
        onClose={() => {
          setDetailsOpen(false);
          setSelected(null);
        }}
        maxWidthClassName="max-w-3xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDetailsOpen(false);
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
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 p-4 dark:border-[#162544]">
              <div className="text-sm font-extrabold text-gray-900 dark:text-slate-100 mb-2">Summary</div>
              {(() => {
                const c = deriveCancellation(selected);
                return (
                  <>
                    <Row label="Task ID" value={selected.id} />
                    <Row label="Status" value={String(selected.status || "").toUpperCase()} />
                    <Row label="Emergency ID" value={selected.emergency?.id} />
                    <Row label="Emergency Type" value={selected.emergency?.emergencyType} />
                    <Row label="Barangay" value={selected.emergency?.barangayName || "-"} />
                    <Row label="Original Assignee" value={c.originalAssignee} />
                    <Row label="Canceled At" value={c.canceledAt ? new Date(c.canceledAt).toLocaleString() : "-"} />
                    <Row label="Canceled By" value={c.canceledBy} />
                    <Row label="Reason" value={c.reason} />
                  </>
                );
              })()}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={reassign.open}
        title="Reassign Dispatch"
        subtitle={reassign.label || "Select volunteers to dispatch"}
        onClose={reassign.closeReassign}
        maxWidthClassName="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={reassign.closeReassign}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
              disabled={reassign.dispatching}
            >
              Close
            </button>
            <button
              type="button"
              onClick={reassign.confirm}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={reassign.dispatching || reassign.selectedIds.length === 0}
            >
              {reassign.dispatching ? "Dispatching..." : "Dispatch"}
            </button>
          </div>
        }
      >
        {reassign.error ? (
          <InlineAlert variant="error" title="Reassign">
            {reassign.error}
          </InlineAlert>
        ) : null}

        {reassign.success ? (
          <div className="mb-3">
            <InlineAlert variant="success" title="Reassign">
              {reassign.success}
            </InlineAlert>
          </div>
        ) : null}

        <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Volunteers</div>

        <div className="mt-2 max-h-80 overflow-y-auto rounded-xl border border-gray-200 dark:border-[#162544]">
          {reassign.loadingVolunteers ? (
            <div className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">Loading volunteers...</div>
          ) : reassign.volunteers.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">No volunteers found.</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-[#162544]">
              {reassign.volunteers.map((v) => {
                const selected = reassign.selectedIds.includes(v.id);
                const isSelectable = reassign.selectable.has(v.id);
                return (
                  <li
                    key={v.id}
                    className={[
                      "px-4 py-3 flex items-center justify-between",
                      isSelectable ? "hover:bg-gray-50 dark:hover:bg-[#0E1626]" : "opacity-70",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => reassign.toggle(v.id)}
                      disabled={!isSelectable}
                      className="flex-1 text-left"
                    >
                      <div className="text-sm font-bold text-gray-900 dark:text-slate-100">{v.name}</div>
                      <div className="text-xs text-gray-600 dark:text-slate-400">
                        {v.skill}
                        {v.barangay ? ` • Brgy. ${v.barangay}` : ""}
                      </div>
                    </button>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => reassign.toggle(v.id)}
                      disabled={!isSelectable}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-3 text-[11px] text-gray-500 dark:text-slate-500">
          Only volunteers marked as <span className="font-semibold">available</span> can be selected.
        </div>
      </Modal>
    </LguShell>
  );
}

