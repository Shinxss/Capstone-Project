import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import InlineAlert from "../../../components/ui/InlineAlert";
import EmptyState from "../../../components/ui/EmptyState";
import type { ChangePasswordInput, ProfileUpdateInput } from "../models/profile.types";
import { useLguProfile } from "../hooks/useLguProfile";

type Props = ReturnType<typeof useLguProfile> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-[170px_1fr] gap-3 py-1">
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

export default function LguProfileView(props: Props) {
  const {
    loading,
    error,
    onRefresh,
    displayName,
    profile,
    saving,
    saveError,
    saveProfile,
    passwordError,
    passwordSuccess,
    passwordBusy,
    submitPasswordChange,
  } = props;

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

  const [passwordForm, setPasswordForm] = useState<ChangePasswordInput>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!profile) return;
    setForm({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      email: profile.email || "",
      barangay: profile.barangay || "",
      municipality: profile.municipality || "",
      position: profile.position || "",
    });
  }, [profile]);

  if (loading) return <LoadingPanel />;
  if (error) return <ErrorPanel error={error} onRetry={onRefresh} />;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">{displayName}</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">View and update your profile information</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
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
            disabled={!profile}
          >
            Edit profile
          </button>
        </div>
      </div>

      {!profile ? (
        <EmptyState className="mt-4" icon={UserRound} title="No profile loaded. Please login again." />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[#0B1220] dark:border-[#162544]">
            <div className="mb-3 text-sm font-extrabold text-gray-900 dark:text-slate-100">Account</div>
            <Row label="Name" value={`${profile.firstName} ${profile.lastName}`.trim()} />
            <Row label="Email" value={profile.email} />
            <Row label="Role" value={profile.role} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[#0B1220] dark:border-[#162544]">
            <div className="mb-3 text-sm font-extrabold text-gray-900 dark:text-slate-100">LGU Details</div>
            <Row label="Barangay" value={profile.barangay || "-"} />
            <Row label="Municipality" value={profile.municipality || "-"} />
            <Row label="Position" value={profile.position || "-"} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[#0B1220] dark:border-[#162544] lg:col-span-2">
            <div className="mb-2 text-sm font-extrabold text-gray-900 dark:text-slate-100">Security</div>
            <div className="text-xs text-gray-500 dark:text-slate-500">
              Password changes require a backend endpoint. This section is a stub for now.
            </div>

            {passwordError ? (
              <div className="mt-3">
                <InlineAlert variant="error" title="Change password">
                  {passwordError}
                </InlineAlert>
              </div>
            ) : null}
            {passwordSuccess ? (
              <div className="mt-3">
                <InlineAlert variant="success" title="Change password">
                  {passwordSuccess}
                </InlineAlert>
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Current password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
                />
                {passwordFieldErrors.currentPassword ? (
                  <div className="mt-1 text-sm text-red-600 dark:text-red-300">{passwordFieldErrors.currentPassword}</div>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">New password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
                />
                {passwordFieldErrors.newPassword ? (
                  <div className="mt-1 text-sm text-red-600 dark:text-red-300">{passwordFieldErrors.newPassword}</div>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Confirm password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
                />
                {passwordFieldErrors.confirmPassword ? (
                  <div className="mt-1 text-sm text-red-600 dark:text-red-300">{passwordFieldErrors.confirmPassword}</div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={async () => {
                  setPasswordFieldErrors({});
                  const result = await submitPasswordChange(passwordForm);
                  if (!result.ok) {
                    setPasswordFieldErrors((result.errors || {}) as Record<string, string>);
                    return;
                  }
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                }}
                disabled={passwordBusy}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {passwordBusy ? "Saving..." : "Change password"}
              </button>
            </div>
          </div>
        </div>
      )}

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
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                setFieldErrors({});
                const result = await saveProfile(form);
                if (!result.ok) {
                  setFieldErrors((result.errors || {}) as Record<string, string>);
                  return;
                }
                setEditOpen(false);
              }}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        }
      >
        {saveError ? (
          <InlineAlert variant="error" title="Save profile">
            {saveError}
          </InlineAlert>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">First name</label>
            <input
              value={form.firstName}
              onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            />
            {fieldErrors.firstName ? <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.firstName}</div> : null}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Last name</label>
            <input
              value={form.lastName}
              onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            />
            {fieldErrors.lastName ? <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.lastName}</div> : null}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            />
            {fieldErrors.email ? <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.email}</div> : null}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Barangay</label>
            <input
              value={form.barangay || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, barangay: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Municipality</label>
            <input
              value={form.municipality || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, municipality: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Position</label>
            <input
              value={form.position || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
              placeholder="e.g., DRRMO Staff"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}

