import { useMemo, useState } from "react";
import Modal from "../../../components/ui/Modal";
import InlineAlert from "../../../components/ui/InlineAlert";
import type { DispatchTask } from "../models/tasks.types";
import { useLguTasksCanceled } from "../hooks/useLguTasksCanceled";

type Props = ReturnType<typeof useLguTasksCanceled> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function deriveCancellation(task: DispatchTask) {
  const canceledAt = task.respondedAt || task.updatedAt || "";
  const canceledBy = "System";
  let reason = "Cancelled";
  if (task.respondedAt) reason = "Auto-cancelled (volunteer accepted another dispatch)";
  const originalAssignee = task.volunteer?.name || "Volunteer";
  return { canceledAt, canceledBy, reason, originalAssignee };
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

export default function LguTasksCanceledView(props: Props) {
  const { loading, error, onRefresh, filtered, exportCsv, filters, setFilters, emergencyTypeOptions, clearFilters, reassign } = props;

  const rows = useMemo(() => filtered, [filtered]);
  const [selected, setSelected] = useState<DispatchTask | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (loading) return <LoadingPanel />;
  if (error) return <ErrorPanel error={error} onRetry={onRefresh} />;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">Canceled</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">Track canceled dispatch offers and reassign if needed</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
          >
            Refresh
          </button>
          <button
            onClick={exportCsv}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            disabled={rows.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Date from</div>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
          />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Date to</div>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
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

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
          No canceled tasks found for the selected filters.
        </div>
      ) : (
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
              {rows.map((task) => {
                const cancellation = deriveCancellation(task);
                return (
                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-[#0E1626]">
                    <td className="px-4 py-3 font-mono text-xs text-gray-800 dark:text-slate-200">{task.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-extrabold text-gray-900 dark:text-slate-100">{String(task.emergency?.emergencyType || "Emergency").toUpperCase()}</div>
                      <div className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">Barangay: {task.emergency?.barangayName || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-slate-100">{cancellation.originalAssignee}</td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                      {cancellation.canceledAt ? new Date(cancellation.canceledAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{cancellation.canceledBy}</td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{cancellation.reason}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(task);
                            setDetailsOpen(true);
                          }}
                          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const emergencyId = String(task.emergency?.id || "");
                            if (!emergencyId) return;
                            void reassign.openReassign({
                              emergencyId,
                              label: `${task.emergency?.emergencyType || "Emergency"}${task.emergency?.barangayName ? ` • Brgy. ${task.emergency?.barangayName}` : ""}`,
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
      )}

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
              <div className="mb-2 text-sm font-extrabold text-gray-900 dark:text-slate-100">Summary</div>
              {(() => {
                const cancellation = deriveCancellation(selected);
                return (
                  <>
                    <Row label="Task ID" value={selected.id} />
                    <Row label="Status" value={String(selected.status || "").toUpperCase()} />
                    <Row label="Emergency ID" value={selected.emergency?.id} />
                    <Row label="Emergency Type" value={selected.emergency?.emergencyType} />
                    <Row label="Barangay" value={selected.emergency?.barangayName || "-"} />
                    <Row label="Original Assignee" value={cancellation.originalAssignee} />
                    <Row label="Canceled At" value={cancellation.canceledAt ? new Date(cancellation.canceledAt).toLocaleString() : "-"} />
                    <Row label="Canceled By" value={cancellation.canceledBy} />
                    <Row label="Reason" value={cancellation.reason} />
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
              onClick={() => void reassign.confirm()}
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

        <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Volunteers</div>

        <div className="mt-2 max-h-80 overflow-y-auto rounded-xl border border-gray-200 dark:border-[#162544]">
          {reassign.loadingVolunteers ? (
            <div className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">Loading volunteers...</div>
          ) : reassign.volunteers.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">No volunteers found.</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-[#162544]">
              {reassign.volunteers.map((volunteer) => {
                const selectedVolunteer = reassign.selectedIds.includes(volunteer.id);
                const isSelectable = reassign.selectable.has(volunteer.id);
                return (
                  <li
                    key={volunteer.id}
                    className={[
                      "flex items-center justify-between px-4 py-3",
                      isSelectable ? "hover:bg-gray-50 dark:hover:bg-[#0E1626]" : "opacity-70",
                    ].join(" ")}
                  >
                    <button type="button" onClick={() => reassign.toggle(volunteer.id)} disabled={!isSelectable} className="flex-1 text-left">
                      <div className="text-sm font-bold text-gray-900 dark:text-slate-100">{volunteer.name}</div>
                      <div className="text-xs text-gray-600 dark:text-slate-400">
                        {volunteer.skill}
                        {volunteer.barangay ? ` • Brgy. ${volunteer.barangay}` : ""}
                      </div>
                    </button>
                    <input
                      type="checkbox"
                      checked={selectedVolunteer}
                      onChange={() => reassign.toggle(volunteer.id)}
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
    </>
  );
}

