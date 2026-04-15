import { Search, Users } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { useResponderTeams } from "../hooks/useResponderTeams";
import ResponderTeamFormModal from "./ResponderTeamFormModal";

type Props = ReturnType<typeof useResponderTeams>;

function formatDate(iso: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export default function LguResponderTeamsView({
  loading,
  error,
  teams,
  total,
  totalPages,
  page,
  setPage,
  query,
  setQuery,
  isActiveFilter,
  setIsActiveFilter,
  refresh,
  formOpen,
  formMode,
  formLoading,
  formSaving,
  selectedTeam,
  openCreate,
  openEdit,
  closeForm,
  saveCreate,
  saveUpdate,
  memberOptions,
  memberOptionsLoading,
  busyTeamId,
  toggleArchive,
  isLgu,
  defaultBarangay,
}: Props) {
  return (
    <>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full max-w-xl">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-500"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by team name, code, description, or barangay"
                className="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
              />
            </div>

            <select
              value={isActiveFilter}
              onChange={(event) =>
                setIsActiveFilter(event.target.value as typeof isActiveFilter)
              }
              className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
            >
              <option value="all">All teams</option>
              <option value="active">Active only</option>
              <option value="archived">Archived only</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              void openCreate();
            }}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Create Team
          </button>
        </div>

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
            Loading responder teams...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            <div className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => {
                  void refresh();
                }}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        ) : null}

        {!loading && !error ? (
          teams.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-2 dark:border-[#162544] dark:bg-[#0B1220]">
              <EmptyState
                icon={Users}
                title="No responder teams found"
                description="Create your first responder team to organize dispatch groups."
              />
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-[#162544] dark:bg-[#0B1220]">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-[#0E1626] dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3">Leader</th>
                    <th className="px-4 py-3">Members</th>
                    <th className="px-4 py-3">Barangay</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
                  {teams.map((team) => {
                    const actionLabel = team.isActive ? "Archive" : "Restore";
                    return (
                      <tr key={team.id}>
                        <td className="px-4 py-3 align-top">
                          <div className="font-semibold text-gray-900 dark:text-slate-100">{team.name}</div>
                          <div className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">
                            {team.code ? `${team.code} • ` : ""}
                            {team.description || "No description"}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top text-xs text-gray-700 dark:text-slate-300">
                          {team.leader ? (
                            <>
                              <div>{team.leader.name}</div>
                              <div className="mt-0.5 text-gray-500 dark:text-slate-500">
                                {team.leader.lifelineId || team.leader.username || "No ID"}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-500 dark:text-slate-500">Unassigned</span>
                          )}
                        </td>

                        <td className="px-4 py-3 align-top text-xs text-gray-700 dark:text-slate-300">
                          {team.memberCount}
                        </td>

                        <td className="px-4 py-3 align-top text-xs text-gray-700 dark:text-slate-300">
                          <div>{team.barangay}</div>
                          <div className="mt-0.5 text-gray-500 dark:text-slate-500">{team.municipality}</div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <span
                            className={
                              team.isActive
                                ? "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                : "inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:bg-slate-500/20 dark:text-slate-300"
                            }
                          >
                            {team.isActive ? "Active" : "Archived"}
                          </span>
                        </td>

                        <td className="px-4 py-3 align-top text-xs text-gray-700 dark:text-slate-300">
                          {formatDate(team.updatedAt)}
                        </td>

                        <td className="px-4 py-3 align-top text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                void openEdit(team.id);
                              }}
                              className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={busyTeamId === team.id}
                              onClick={() => {
                                void toggleArchive(team);
                              }}
                              className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
                            >
                              {busyTeamId === team.id ? "Working..." : actionLabel}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : null}

        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400">
          <span>
            {total.toLocaleString()} teams • Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1 || loading}
              className="rounded-md border border-gray-200 bg-white px-2 py-1 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-md border border-gray-200 bg-white px-2 py-1 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ResponderTeamFormModal
        open={formOpen}
        mode={formMode}
        loading={formLoading}
        saving={formSaving}
        team={selectedTeam}
        responderOptions={memberOptions}
        responderOptionsLoading={memberOptionsLoading}
        isLgu={isLgu}
        defaultBarangay={defaultBarangay}
        onClose={closeForm}
        onCreate={saveCreate}
        onUpdate={saveUpdate}
      />
    </>
  );
}

