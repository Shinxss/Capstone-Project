import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { useLguTasks } from "@/features/tasks/hooks/useLguTasks";
import { verifyTask } from "@/features/tasks/services/tasksApi";
import { toastError, toastSuccess } from "@/services/feedback/toast.service";

type TasksTab = "IN_PROGRESS" | "FOR_REVIEW" | "COMPLETED" | "CANCELED";

const tabConfig: Record<TasksTab, { label: string; status: string }> = {
  IN_PROGRESS: { label: "In Progress", status: "ACCEPTED" },
  FOR_REVIEW: { label: "For Review", status: "DONE" },
  COMPLETED: { label: "Completed", status: "VERIFIED" },
  CANCELED: { label: "Canceled", status: "CANCELLED" },
};

export default function AdminTasks() {
  const [tab, setTab] = useState<TasksTab>("FOR_REVIEW");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const inProgress = useLguTasks(tabConfig.IN_PROGRESS.status);
  const forReview = useLguTasks(tabConfig.FOR_REVIEW.status);
  const completed = useLguTasks(tabConfig.COMPLETED.status);
  const canceled = useLguTasks(tabConfig.CANCELED.status);

  const activeState = useMemo(() => {
    if (tab === "IN_PROGRESS") return inProgress;
    if (tab === "FOR_REVIEW") return forReview;
    if (tab === "COMPLETED") return completed;
    return canceled;
  }, [canceled, completed, forReview, inProgress, tab]);

  const tasks = activeState.tasks ?? [];

  async function onVerifyTask(taskId: string) {
    setVerifyingId(taskId);
    try {
      await verifyTask(taskId);
      toastSuccess("Task verified.");
      await Promise.all([forReview.refetch(), completed.refetch()]);
    } catch (err: any) {
      toastError(err?.response?.data?.message ?? err?.message ?? "Failed to verify task");
    } finally {
      setVerifyingId(null);
    }
  }

  return (
    <AdminShell title="Tasks & Assignments" subtitle="Review active and completed dispatch tasks">
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(tabConfig) as TasksTab[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={[
                "rounded-md border px-3 py-1.5 text-sm font-semibold transition",
                tab === value
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]",
              ].join(" ")}
            >
              {tabConfig[value].label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => void activeState.refetch()}
            className="ml-auto rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
          >
            Refresh
          </button>
        </div>

        {activeState.loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
            Loading tasks...
          </div>
        ) : null}

        {activeState.error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {activeState.error}
          </div>
        ) : null}

        {!activeState.loading && !activeState.error ? (
          tasks.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-[#162544] dark:bg-[#0B1220]">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-[#0E1626] dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Emergency</th>
                    <th className="px-4 py-3">Volunteer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-slate-100">
                          {String(task.emergency?.emergencyType || "Emergency").toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-slate-400">
                          {task.emergency?.barangayName ? `Brgy. ${task.emergency.barangayName}` : "Barangay unknown"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{task.volunteer?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{task.status}</td>
                      <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                        {task.updatedAt ? new Date(task.updatedAt).toLocaleString() : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {tab === "FOR_REVIEW" ? (
                          <button
                            type="button"
                            onClick={() => void onVerifyTask(task.id)}
                            disabled={verifyingId === task.id}
                            className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {verifyingId === task.id ? "Verifying..." : "Verify"}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
              No tasks in this category.
            </div>
          )
        ) : null}
      </div>
    </AdminShell>
  );
}
