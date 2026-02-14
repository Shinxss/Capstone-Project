import { useEffect, useState } from "react";
import LguShell from "../../components/lgu/LguShell";
import Modal from "../../components/ui/Modal";
import InlineAlert from "../../components/ui/InlineAlert";
import { useLguProfile } from "../../features/profile/hooks/useLguProfile";
import type { ChangePasswordInput, ProfileUpdateInput } from "../../features/profile/models/profile.types";

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-[170px_1fr] gap-3 py-1">
      <div className="text-xs font-semibold text-gray-500 dark:text-slate-400">{label}</div>
      <div className="text-sm text-gray-900 dark:text-slate-100 break-words">{value || "-"}</div>
    </div>
  );
}

export default function LguProfile() {
  const vm = useLguProfile();

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<ProfileUpdateInput>({
    firstName: "",
    lastName: "",
    email: "",
    barangay: "",
    municipality: "",
    position: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!vm.profile) return;
    setForm({
      firstName: vm.profile.firstName || "",
      lastName: vm.profile.lastName || "",
      email: vm.profile.email || "",
      barangay: vm.profile.barangay || "",
      municipality: vm.profile.municipality || "",
      position: vm.profile.position || "",
    });
  }, [vm.profile]);

  const [pw, setPw] = useState<ChangePasswordInput>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});

  return (
    <LguShell title="Profile" subtitle="LGU staff profile management">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">{vm.displayName}</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">View and update your profile information</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={vm.refresh}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
          >
            Refresh
          </button>
          <button
            onClick={() => {
              setFieldErrors({});
              setEditOpen(true);
            }}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            disabled={!vm.profile}
          >
            Edit profile
          </button>
        </div>
      </div>

      {vm.loading ? (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
          Loading...
        </div>
      ) : null}

      {vm.error ? (
        <div className="mt-4">
          <InlineAlert variant="error" title="Profile">
            {vm.error}
          </InlineAlert>
        </div>
      ) : null}

      {!vm.loading && !vm.error && !vm.profile ? (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
          No profile loaded. Please login again.
        </div>
      ) : null}

      {vm.profile ? (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[#0B1220] dark:border-[#162544]">
            <div className="text-sm font-extrabold text-gray-900 dark:text-slate-100 mb-3">Account</div>
            <Row label="Name" value={`${vm.profile.firstName} ${vm.profile.lastName}`.trim()} />
            <Row label="Email" value={vm.profile.email} />
            <Row label="Role" value={vm.profile.role} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[#0B1220] dark:border-[#162544]">
            <div className="text-sm font-extrabold text-gray-900 dark:text-slate-100 mb-3">LGU Details</div>
            <Row label="Barangay" value={vm.profile.barangay || "-"} />
            <Row label="Municipality" value={vm.profile.municipality || "-"} />
            <Row label="Position" value={vm.profile.position || "-"} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2 dark:bg-[#0B1220] dark:border-[#162544]">
            <div className="text-sm font-extrabold text-gray-900 dark:text-slate-100 mb-2">Security</div>
            <div className="text-xs text-gray-500 dark:text-slate-500">
              Password changes require a backend endpoint. This section is a stub for now.
            </div>

            {vm.passwordError ? (
              <div className="mt-3">
                <InlineAlert variant="error" title="Change password">
                  {vm.passwordError}
                </InlineAlert>
              </div>
            ) : null}

            {vm.passwordSuccess ? (
              <div className="mt-3">
                <InlineAlert variant="success" title="Change password">
                  {vm.passwordSuccess}
                </InlineAlert>
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Current password</label>
                <input
                  type="password"
                  value={pw.currentPassword}
                  onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
                />
                {pwErrors.currentPassword ? (
                  <div className="mt-1 text-sm text-red-600 dark:text-red-300">{pwErrors.currentPassword}</div>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">New password</label>
                <input
                  type="password"
                  value={pw.newPassword}
                  onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
                />
                {pwErrors.newPassword ? (
                  <div className="mt-1 text-sm text-red-600 dark:text-red-300">{pwErrors.newPassword}</div>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Confirm password</label>
                <input
                  type="password"
                  value={pw.confirmPassword}
                  onChange={(e) => setPw((p) => ({ ...p, confirmPassword: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
                />
                {pwErrors.confirmPassword ? (
                  <div className="mt-1 text-sm text-red-600 dark:text-red-300">{pwErrors.confirmPassword}</div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={async () => {
                  setPwErrors({});
                  const res = await vm.submitPasswordChange(pw);
                  if (!res.ok) {
                    setPwErrors(res.errors as any);
                    return;
                  }
                  setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
                }}
                disabled={vm.passwordBusy}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {vm.passwordBusy ? "Saving..." : "Change password"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Modal
        open={editOpen}
        title="Edit Profile"
        subtitle="Updates are saved locally until an API endpoint is available"
        onClose={() => setEditOpen(false)}
        maxWidthClassName="max-w-3xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
              disabled={vm.saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                setFieldErrors({});
                const res = await vm.saveProfile(form);
                if (!res.ok) {
                  setFieldErrors(res.errors as any);
                  return;
                }
                setEditOpen(false);
              }}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={vm.saving}
            >
              {vm.saving ? "Saving..." : "Save"}
            </button>
          </div>
        }
      >
        {vm.saveError ? (
          <InlineAlert variant="error" title="Save profile">
            {vm.saveError}
          </InlineAlert>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">First name</label>
            <input
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            />
            {fieldErrors.firstName ? <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.firstName}</div> : null}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Last name</label>
            <input
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            />
            {fieldErrors.lastName ? <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.lastName}</div> : null}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            />
            {fieldErrors.email ? <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.email}</div> : null}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Barangay</label>
            <input
              value={form.barangay || ""}
              onChange={(e) => setForm((p) => ({ ...p, barangay: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Municipality</label>
            <input
              value={form.municipality || ""}
              onChange={(e) => setForm((p) => ({ ...p, municipality: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Position</label>
            <input
              value={form.position || ""}
              onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
              placeholder="e.g., DRRMO Staff"
            />
          </div>
        </div>
      </Modal>
    </LguShell>
  );
}

