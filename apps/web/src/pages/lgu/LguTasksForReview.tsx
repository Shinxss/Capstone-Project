import { useMemo, useState } from "react";
import LguShell from "../../components/lgu/LguShell";
import { useLguTasks } from "../../features/tasks/hooks/useLguTasks";
import { verifyTask } from "../../features/tasks/services/tasksApi";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function LguTasksForReview() {
  const { tasks, loading, error, refetch } = useLguTasks("DONE");
  const [verifying, setVerifying] = useState<string | null>(null);

  const rows = useMemo(() => tasks, [tasks]);

  const onVerify = async (id: string) => {
    try {
      setVerifying(id);
      await verifyTask(id);
      await refetch();
    } finally {
      setVerifying(null);
    }
  };

  return (
    <LguShell title="Tasks" subtitle="Volunteer-completed emergencies awaiting LGU verification">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">For Review</div>
          <div className="text-xs text-gray-500">Volunteer marked as done + uploaded proof</div>
        </div>
        <button
          onClick={refetch}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-600">Loading…</div>
      )}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-600">
          No tasks for review.
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Emergency</th>
                <th className="px-4 py-3">Responder</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Proof</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3">
                    <div className="font-extrabold text-gray-900">{String(t.emergency.emergencyType).toUpperCase()}</div>
                    <div className="mt-0.5 text-xs text-gray-600">
                      {t.emergency.barangayName ? `Barangay: ${t.emergency.barangayName}` : "Barangay: —"}
                    </div>
                    {t.emergency.notes ? <div className="mt-1 text-xs text-gray-700">{t.emergency.notes}</div> : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{t.volunteer?.name ?? "Volunteer"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {t.completedAt ? new Date(t.completedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {t.proofs && t.proofs.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {t.proofs.slice(0, 3).map((p, idx) => (
                          <a
                            key={idx}
                            href={`${API_BASE}${p.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-100"
                          >
                            Proof {idx + 1}
                          </a>
                        ))}
                        {t.proofs.length > 3 ? (
                          <span className="text-xs text-gray-500">+{t.proofs.length - 3} more</span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">No proof uploaded</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onVerify(t.id)}
                      disabled={verifying === t.id}
                      className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {verifying === t.id ? "Verifying…" : "Verify"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </LguShell>
  );
}
