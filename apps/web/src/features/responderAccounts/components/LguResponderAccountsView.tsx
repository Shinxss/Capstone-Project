import { Search, ShieldCheck } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { useResponderAccounts } from "../hooks/useResponderAccounts";
import ResponderAccountFormModal from "./ResponderAccountFormModal";

type Props = ReturnType<typeof useResponderAccounts>;

function formatDate(iso: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function splitSkills(raw?: string) {
  return String(raw ?? "")
    .split(/[,/;|\n]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function initialsFromName(fullName: string) {
  const tokens = String(fullName)
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (tokens.length === 0) return "R";
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return `${tokens[0][0] ?? ""}${tokens[1][0] ?? ""}`.toUpperCase();
}

export default function LguResponderAccountsView({
  loading,
  error,
  accounts,
  total,
  totalPages,
  page,
  setPage,
  query,
  setQuery,
  isActiveFilter,
  setIsActiveFilter,
  onDutyFilter,
  setOnDutyFilter,
  refresh,
  formOpen,
  formMode,
  formLoading,
  formSaving,
  selectedAccount,
  openCreate,
  openEdit,
  closeForm,
  saveCreate,
  saveUpdate,
  busyAccountId,
  toggleActivation,
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
                placeholder="Search responder by name, username, email, lifeline ID, or skill"
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
              <option value="all">All accounts</option>
              <option value="active">Active only</option>
              <option value="suspended">Suspended only</option>
            </select>

            <select
              value={onDutyFilter}
              onChange={(event) =>
                setOnDutyFilter(event.target.value as typeof onDutyFilter)
              }
              className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
            >
              <option value="all">All duty status</option>
              <option value="on">On duty</option>
              <option value="off">Off duty</option>
            </select>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Add Responder
          </button>
        </div>

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
            Loading responder accounts...
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
          accounts.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-2 dark:border-[#162544] dark:bg-[#0B1220]">
              <EmptyState
                icon={ShieldCheck}
                title="No responder accounts found"
                description="Try adjusting filters or create your first responder account."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {accounts.map((account) => {
                const skills = splitSkills(account.skills);
                const activeLabel = account.isActive ? "Active" : "Suspended";
                const dutyLabel = account.onDuty ? "On duty" : "Off duty";
                const actionLabel = account.isActive ? "Suspend" : "Reactivate";

                return (
                  <div
                    key={account.id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-[#162544] dark:bg-[#0B1220]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-red-200 bg-red-100 text-sm font-black text-red-600 ring-2 ring-red-500 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-400">
                          {initialsFromName(account.fullName)}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-lg font-bold text-gray-900 dark:text-slate-100">
                            {account.fullName}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-gray-600 dark:text-slate-400">
                            {account.lifelineId ? `${account.lifelineId} - ` : ""}
                            {account.username ? `@${account.username}` : "No username"}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-gray-500 dark:text-slate-500">
                            {account.barangay}, {account.municipality}
                          </div>
                        </div>
                      </div>

                      <span
                        className={
                          account.isActive
                            ? "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                            : "inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-500/20 dark:text-red-300"
                        }
                      >
                        {activeLabel}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1 text-xs text-gray-700 dark:text-slate-300">
                      <div>{account.contactNo || "No contact"}</div>
                      <div className="truncate">{account.email || "No email"}</div>
                      <div className="text-gray-600 dark:text-slate-400">
                        Team: {account.team?.name || "Unassigned"}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      <span
                        className={
                          account.onDuty
                            ? "inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                            : "inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:bg-slate-500/20 dark:text-slate-300"
                        }
                      >
                        {dutyLabel}
                      </span>

                      {skills.length === 0 ? (
                        <span className="text-[11px] text-gray-500 dark:text-slate-500">No skills listed</span>
                      ) : (
                        <>
                          {skills.slice(0, 3).map((skill) => (
                            <span
                              key={`${account.id}-${skill}`}
                              className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:border-[#22365D] dark:bg-[#0E1626] dark:text-slate-300"
                            >
                              {skill}
                            </span>
                          ))}
                          {skills.length > 3 ? (
                            <span className="text-[11px] text-gray-500 dark:text-slate-500">+{skills.length - 3}</span>
                          ) : null}
                        </>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 text-xs text-gray-600 dark:border-[#162544] dark:text-slate-400">
                      <span>Created {formatDate(account.createdAt)}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            void openEdit(account.id);
                          }}
                          className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={busyAccountId === account.id}
                          onClick={() => {
                            void toggleActivation(account);
                          }}
                          className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
                        >
                          {busyAccountId === account.id ? "Working..." : actionLabel}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : null}

        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400">
          <span>
            {total.toLocaleString()} responders - Page {page} of {totalPages}
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

      <ResponderAccountFormModal
        open={formOpen}
        mode={formMode}
        loading={formLoading}
        saving={formSaving}
        account={selectedAccount}
        isLgu={isLgu}
        defaultBarangay={defaultBarangay}
        onClose={closeForm}
        onCreate={saveCreate}
        onUpdate={saveUpdate}
      />
    </>
  );
}
