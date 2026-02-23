import { useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useConfirm } from "@/features/feedback/hooks/useConfirm";
import type { useAdminUsers } from "../hooks/useAdminUsers";
import type { AdminUsersTab } from "../hooks/useAdminUsers";

type Props = ReturnType<typeof useAdminUsers>;

type LguFormState = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  lguPosition: string;
  barangay: string;
  email: string;
};

type CdrrmoFormState = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
};

const tabLabels: Record<AdminUsersTab, string> = {
  LGU: "LGU Accounts",
  CDRRMO: "CDRRMO Admins",
  VOLUNTEER: "Volunteers",
  COMMUNITY: "Community",
};

function emptyLguForm(): LguFormState {
  return {
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    lguPosition: "",
    barangay: "",
    email: "",
  };
}

function emptyCdrrmoForm(): CdrrmoFormState {
  return {
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
  };
}

export default function AdminUserManagementView({
  isSuper,
  tab,
  setTab,
  visibleTabs,
  query,
  setQuery,
  page,
  setPage,
  limit,
  setLimit,
  items,
  loading,
  error,
  busyId,
  pagination,
  refresh,
  createLguAccount,
  createCdrrmoAdmin,
  toggleActivation,
}: Props) {
  const confirm = useConfirm();
  const [lguModalOpen, setLguModalOpen] = useState(false);
  const [cdrrmoModalOpen, setCdrrmoModalOpen] = useState(false);
  const [lguForm, setLguForm] = useState<LguFormState>(emptyLguForm());
  const [cdrrmoForm, setCdrrmoForm] = useState<CdrrmoFormState>(emptyCdrrmoForm());

  const title = useMemo(() => tabLabels[tab], [tab]);

  const canCreateLgu = isSuper;
  const canCreateCdrrmo = isSuper;

  async function onCreateLgu() {
    await createLguAccount({
      username: lguForm.username.trim(),
      password: lguForm.password,
      firstName: lguForm.firstName.trim(),
      lastName: lguForm.lastName.trim(),
      lguPosition: lguForm.lguPosition.trim() || undefined,
      barangay: lguForm.barangay.trim(),
      email: lguForm.email.trim() || undefined,
    });
    setLguForm(emptyLguForm());
    setLguModalOpen(false);
  }

  async function onCreateCdrrmo() {
    await createCdrrmoAdmin({
      username: cdrrmoForm.username.trim(),
      password: cdrrmoForm.password,
      firstName: cdrrmoForm.firstName.trim(),
      lastName: cdrrmoForm.lastName.trim(),
      email: cdrrmoForm.email.trim(),
    });
    setCdrrmoForm(emptyCdrrmoForm());
    setCdrrmoModalOpen(false);
  }

  return (
    <>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap gap-2">
          {visibleTabs.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTab(value);
                setPage(1);
              }}
              className={[
                "rounded-md border px-3 py-1.5 text-sm font-semibold transition",
                tab === value
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]",
              ].join(" ")}
            >
              {tabLabels[value]}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={`Search ${title.toLowerCase()}`}
              className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 sm:w-80 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
            />
            <select
              value={String(limit)}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
              className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
            >
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Refresh
            </button>
            {tab === "LGU" && canCreateLgu ? (
              <button
                type="button"
                onClick={() => setLguModalOpen(true)}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Create LGU Account
              </button>
            ) : null}
            {tab === "CDRRMO" && canCreateCdrrmo ? (
              <button
                type="button"
                onClick={() => setCdrrmoModalOpen(true)}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Create CDRRMO Admin
              </button>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
            Loading users...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : null}

        {!loading && !error ? (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-[#162544] dark:bg-[#0B1220]">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-[#0E1626] dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Barangay</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
                {items.map((item) => {
                  const canToggle = isSuper || item.role === "VOLUNTEER" || item.role === "COMMUNITY";
                  const actionLabel = item.isActive ? "Suspend" : "Reactivate";

                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-slate-100">
                          {[item.firstName, item.lastName].filter(Boolean).join(" ").trim() || item.username || "-"}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-slate-400">
                          {item.username ? `@${item.username}` : "-"}
                          {item.email ? ` • ${item.email}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                        {item.role}
                        {item.adminTier ? ` (${item.adminTier})` : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{item.barangay || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            item.isActive
                              ? "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                              : "inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-500/20 dark:text-red-300"
                          }
                        >
                          {item.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={!canToggle || busyId === item.id}
                          onClick={() =>
                            void (async () => {
                              const ok = await confirm({
                                title: `${actionLabel} this account?`,
                                description: `${item.username || item.id} will be ${item.isActive ? "disabled" : "enabled"}.`,
                                confirmText: actionLabel,
                                variant: item.isActive ? "destructive" : "default",
                              });
                              if (!ok) return;
                              await toggleActivation(item);
                            })()
                          }
                          className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
                        >
                          {busyId === item.id ? "Working..." : actionLabel}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
          </span>
          <div className="flex gap-2">
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
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page >= pagination.totalPages || loading}
              className="rounded-md border border-gray-200 bg-white px-2 py-1 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={lguModalOpen}
        onClose={() => setLguModalOpen(false)}
        title="Create LGU Account"
        subtitle="Create a barangay LGU account with municipality fixed to Dagupan City."
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setLguModalOpen(false)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void onCreateLgu()}
              disabled={busyId === "create_lgu" || !lguForm.username || !lguForm.password || !lguForm.barangay || !lguForm.firstName || !lguForm.lastName}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Create
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input value={lguForm.username} onChange={(event) => setLguForm((prev) => ({ ...prev, username: event.target.value }))} placeholder="Username" className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100" />
          <input value={lguForm.password} onChange={(event) => setLguForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="Password" type="password" className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100" />
          <input value={lguForm.firstName} onChange={(event) => setLguForm((prev) => ({ ...prev, firstName: event.target.value }))} placeholder="First name" className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100" />
          <input value={lguForm.lastName} onChange={(event) => setLguForm((prev) => ({ ...prev, lastName: event.target.value }))} placeholder="Last name" className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100" />
          <input value={lguForm.lguPosition} onChange={(event) => setLguForm((prev) => ({ ...prev, lguPosition: event.target.value }))} placeholder="Position" className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100" />
          <input value={lguForm.barangay} onChange={(event) => setLguForm((prev) => ({ ...prev, barangay: event.target.value }))} placeholder="Barangay" className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100" />
          <input value={lguForm.email} onChange={(event) => setLguForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email (optional)" className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100 sm:col-span-2" />
        </div>
      </Modal>

      <Modal
        open={cdrrmoModalOpen}
        onClose={() => setCdrrmoModalOpen(false)}
        title="Create CDRRMO Admin"
        subtitle="Creates an ADMIN account with admin tier fixed to CDRRMO."
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCdrrmoModalOpen(false)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void onCreateCdrrmo()}
              disabled={busyId === "create_cdrrmo" || !cdrrmoForm.username || !cdrrmoForm.password || !cdrrmoForm.firstName || !cdrrmoForm.lastName || !cdrrmoForm.email}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Create
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input value={cdrrmoForm.username} onChange={(event) => setCdrrmoForm((prev) => ({ ...prev, username: event.target.value }))} placeholder="Username" className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100" />
          <input value={cdrrmoForm.password} onChange={(event) => setCdrrmoForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="Password" type="password" className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100" />
          <input value={cdrrmoForm.firstName} onChange={(event) => setCdrrmoForm((prev) => ({ ...prev, firstName: event.target.value }))} placeholder="First name" className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100" />
          <input value={cdrrmoForm.lastName} onChange={(event) => setCdrrmoForm((prev) => ({ ...prev, lastName: event.target.value }))} placeholder="Last name" className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100" />
          <input value={cdrrmoForm.email} onChange={(event) => setCdrrmoForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" type="email" className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100 sm:col-span-2" />
        </div>
      </Modal>
    </>
  );
}
