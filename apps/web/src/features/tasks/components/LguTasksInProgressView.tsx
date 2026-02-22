import { Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import EmptyState from "../../../components/ui/EmptyState";
import { useLguTasksInProgress } from "../hooks/useLguTasksInProgress";

type Props = ReturnType<typeof useLguTasksInProgress> & {
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

export default function LguTasksInProgressView(props: Props) {
  const { loading, error, onRefresh, groups } = props;

  if (loading) return <LoadingPanel />;
  if (error) return <ErrorPanel error={error} onRetry={onRefresh} />;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">In Progress</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">Accepted dispatches grouped by emergency</div>
        </div>
        <button
          onClick={onRefresh}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
        >
          Refresh
        </button>
      </div>

      {groups.length === 0 ? (
        <EmptyState className="mt-4" icon={Clock3} title="No emergencies in progress." />
      ) : null}

      <div className="mt-4 space-y-3">
        {groups.map((group) => (
          <div key={group.emergency.id} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-base font-extrabold text-gray-900 dark:text-slate-100">{String(group.emergency.emergencyType).toUpperCase()} Emergency</div>
                <div className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">
                  {group.emergency.barangayName ? `Barangay: ${group.emergency.barangayName}` : "Barangay: -"} • (
                  {group.emergency.lat?.toFixed?.(5)}, {group.emergency.lng?.toFixed?.(5)})
                </div>
                {group.emergency.notes ? <div className="mt-2 text-sm text-gray-700 dark:text-slate-300">{group.emergency.notes}</div> : null}
              </div>

              <Link
                to={`/lgu/live-map?emergencyId=${group.emergency.id}`}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Open Live Map
              </Link>
            </div>

            <div className="mt-3">
              <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-500">Responders</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.offers.map((offer) => (
                  <span key={offer.id} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-800 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200">
                    {offer.volunteer?.name ?? "Volunteer"}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

