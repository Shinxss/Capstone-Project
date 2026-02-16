import { useMemo, useState } from "react";
import Modal from "../../../components/ui/Modal";
import type { DispatchTask } from "../models/tasks.types";
import { useLguTasksCompleted } from "../hooks/useLguTasksCompleted";

type Props = ReturnType<typeof useLguTasksCompleted> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function StatusPill({ status }: { status: string }) {
  const normalized = String(status || "").toUpperCase();
  const cls =
    normalized === "VERIFIED"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900/50"
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

export default function LguTasksCompletedView(props: Props) {
  const { loading, error, onRefresh, filtered, exportCsv, filters, setFilters, emergencyTypeOptions, clearFilters } = props;

  const rows = useMemo(() => filtered, [filtered]);
  const [selected, setSelected] = useState<DispatchTask | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (loading) return <LoadingPanel />;
  if (error) return <ErrorPanel error={error} onRetry={onRefresh} />;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">Completed</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">Verified dispatch tasks for auditing and tracking</div>
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

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
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
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544] md:col-span-4">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Volunteer name</div>
          <input
            value={filters.volunteer}
            onChange={(e) => setFilters((prev) => ({ ...prev, volunteer: e.target.value }))}
            placeholder="Search volunteer"
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100 dark:placeholder:text-slate-500"
          />
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
          No completed tasks found for the selected filters.
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white dark:bg-[#0B1220] dark:border-[#162544]">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-[#0E1626] dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Emergency</th>
                <th className="px-4 py-3">Volunteer</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
              {rows.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-[#0E1626]">
                  <td className="px-4 py-3 font-mono text-xs text-gray-800 dark:text-slate-200">{task.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-extrabold text-gray-900 dark:text-slate-100">{String(task.emergency?.emergencyType || "Emergency").toUpperCase()}</div>
                    <div className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">
                      Emergency ID: <span className="font-mono">{task.emergency?.id || "-"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 dark:text-slate-100">{task.volunteer?.name || "Volunteer"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                    {task.emergency?.barangayName ? `Barangay: ${task.emergency.barangayName}` : "Barangay: -"}
                    <div className="mt-0.5 text-[11px] text-gray-500 dark:text-slate-500">
                      ({Number(task.emergency?.lat || 0).toFixed(5)}, {Number(task.emergency?.lng || 0).toFixed(5)})
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{task.completedAt ? new Date(task.completedAt).toLocaleString() : "-"}</td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{task.verifiedAt ? new Date(task.verifiedAt).toLocaleString() : "-"}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={task.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(task);
                        setDetailsOpen(true);
                      }}
                      className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
                    >
                      View details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={detailsOpen && !!selected}
        title="Task Details"
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
              <Row label="Task ID" value={selected.id} />
              <Row label="Status" value={String(selected.status || "").toUpperCase()} />
              <Row label="Emergency ID" value={selected.emergency?.id} />
              <Row label="Emergency Type" value={selected.emergency?.emergencyType} />
              <Row label="Barangay" value={selected.emergency?.barangayName || "-"} />
              <Row label="Volunteer" value={selected.volunteer?.name || "-"} />
              <Row label="Completed At" value={selected.completedAt ? new Date(selected.completedAt).toLocaleString() : "-"} />
              <Row label="Verified At" value={selected.verifiedAt ? new Date(selected.verifiedAt).toLocaleString() : "-"} />
            </div>

            {selected.emergency?.notes ? (
              <div className="rounded-xl border border-gray-200 p-4 dark:border-[#162544]">
                <div className="mb-2 text-sm font-extrabold text-gray-900 dark:text-slate-100">Emergency Notes</div>
                <div className="whitespace-pre-wrap text-sm text-gray-800 dark:text-slate-200">{selected.emergency.notes}</div>
              </div>
            ) : null}

            {selected.chainRecord ? (
              <div className="rounded-xl border border-gray-200 p-4 dark:border-[#162544]">
                <div className="mb-2 text-sm font-extrabold text-gray-900 dark:text-slate-100">Audit (Blockchain)</div>
                <Row label="Network" value={selected.chainRecord.network} />
                <Row label="Contract" value={selected.chainRecord.contractAddress} />
                <Row label="Tx Hash" value={selected.chainRecord.txHash} />
                <Row label="Record Hash" value={selected.chainRecord.recordHash} />
                <Row label="Recorded At" value={selected.chainRecord.recordedAt ? new Date(selected.chainRecord.recordedAt).toLocaleString() : "-"} />
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}

