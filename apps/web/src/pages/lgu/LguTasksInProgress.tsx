import { useMemo } from "react";
import { Link } from "react-router-dom";
import LguShell from "../../components/lgu/LguShell";
import { useLguTasks } from "../../features/tasks/hooks/useLguTasks";

export default function LguTasksInProgress() {
  const { tasks, loading, error, refetch } = useLguTasks("ACCEPTED");

  const groups = useMemo(() => {
    const by: Record<string, any> = {};
    for (const t of tasks) {
      const eid = t.emergency?.id;
      if (!eid) continue;
      if (!by[eid]) by[eid] = { emergency: t.emergency, offers: [] as typeof tasks };
      by[eid].offers.push(t);
    }
    return Object.values(by);
  }, [tasks]);

  return (
    <LguShell title="Tasks" subtitle="Emergencies currently being responded to">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">In Progress</div>
          <div className="text-xs text-gray-500">Accepted dispatches grouped by emergency</div>
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

      {!loading && !error && groups.length === 0 && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-600">
          No emergencies in progress.
        </div>
      )}

      <div className="mt-4 space-y-3">
        {groups.map((g: any) => (
          <div key={g.emergency.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-base font-extrabold text-gray-900">
                  {String(g.emergency.emergencyType).toUpperCase()} Emergency
                </div>
                <div className="mt-0.5 text-xs text-gray-600">
                  {g.emergency.barangayName ? `Barangay: ${g.emergency.barangayName}` : "Barangay: —"} · ({g.emergency.lat?.toFixed?.(5)},{" "}
                  {g.emergency.lng?.toFixed?.(5)})
                </div>
                {g.emergency.notes ? (
                  <div className="mt-2 text-sm text-gray-700">{g.emergency.notes}</div>
                ) : null}
              </div>

              <Link
                to={`/lgu/live-map?emergencyId=${g.emergency.id}`}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Open Live Map
              </Link>
            </div>

            <div className="mt-3">
              <div className="text-xs font-semibold text-gray-500 uppercase">Responders</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {g.offers.map((o: any) => (
                  <span
                    key={o.id}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-800"
                  >
                    {o.volunteer?.name ?? "Volunteer"}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </LguShell>
  );
}
