import { useMemo, useState } from "react";
import { Pencil, UserRound } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import InlineAlert from "../../../components/ui/InlineAlert";
import EmptyState from "../../../components/ui/EmptyState";
import type { ProfileUpdateInput } from "../models/profile.types";
import { useLguProfile } from "../hooks/useLguProfile";

type Props = ReturnType<typeof useLguProfile> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

type EditSection = "personal" | "address" | null;

const inputClassName =
  "mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100";

function InfoCell({ label, value, className = "" }: { label: string; value?: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100 break-words">{value || "-"}</div>
    </div>
  );
}

function CardHeader({ title, onEdit }: { title: string; onEdit: () => void }) {
  return (
    <div className="mb-4 border-b border-gray-200 pb-3 dark:border-[#162544]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-extrabold text-gray-900 dark:text-slate-100">{title}</h2>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-md border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 dark:border-red-500 dark:bg-red-600 dark:hover:bg-red-500"
        >
          <Pencil size={12} />
          Edit
        </button>
      </div>
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
  const { loading, error, onRefresh, displayName, profile, saving, saveError, saveProfile } = props;

  const [editSection, setEditSection] = useState<EditSection>(null);
  const [form, setForm] = useState<ProfileUpdateInput>({
    firstName: "",
    lastName: "",
    birthdate: "",
    email: "",
    contactNo: "",
    country: "",
    municipality: "",
    barangay: "",
    postalCode: "",
    position: "",
    avatarUrl: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fullName = useMemo(() => {
    if (!profile) return displayName;
    const value = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
    return value || displayName;
  }, [profile, displayName]);

  const initials = useMemo(() => {
    if (!profile) return "";
    const first = (profile.firstName || "").trim().charAt(0);
    const last = (profile.lastName || "").trim().charAt(0);
    return `${first}${last}`.toUpperCase();
  }, [profile]);

  const addressSummary = useMemo(() => {
    if (!profile) return "-";
    const parts = [profile.barangay, profile.municipality, profile.country]
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "-";
  }, [profile]);

  const onOpenEdit = (section: EditSection) => {
    if (profile) {
      setForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        birthdate: profile.birthdate || "",
        email: profile.email || "",
        contactNo: profile.contactNo || "",
        country: profile.country || "",
        municipality: profile.municipality || "",
        barangay: profile.barangay || "",
        postalCode: profile.postalCode || "",
        position: profile.position || "",
        avatarUrl: profile.avatarUrl || "",
      });
    }
    setFieldErrors({});
    setEditSection(section);
  };

  const onCloseEdit = () => {
    if (saving) return;
    setEditSection(null);
    setFieldErrors({});
  };

  const handleSave = async () => {
    setFieldErrors({});
    const result = await saveProfile(form);
    if (!result.ok) {
      setFieldErrors((result.errors || {}) as Record<string, string>);
      return;
    }
    setEditSection(null);
  };

  if (loading) return <LoadingPanel />;
  if (error) return <ErrorPanel error={error} onRetry={onRefresh} />;

  return (
    <>
      <div className="space-y-4 px-2 sm:px-4 lg:px-10">
        <div className="text-xl font-extrabold text-gray-900 dark:text-slate-100">My Profile</div>

        {!profile ? (
          <EmptyState icon={UserRound} title="No profile loaded. Please login again." />
        ) : (
          <>
            <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[#162544] dark:bg-[#0B1220]">
              <div className="flex items-center gap-4">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={fullName}
                    className="h-16 w-16 rounded-full border border-gray-200 object-cover dark:border-[#162544]"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-lg font-bold text-gray-700 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200">
                    {initials || <UserRound size={22} />}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="text-lg font-extrabold text-gray-900 dark:text-slate-100">{fullName || "-"}</div>
                  <div className="mt-0.5 text-sm text-gray-600 dark:text-slate-400">
                    LGU Position: {profile.position || "-"}
                  </div>
                  <div className="mt-0.5 text-sm text-gray-600 dark:text-slate-400">{addressSummary}</div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[#162544] dark:bg-[#0B1220]">
              <CardHeader title="Personal Information" onEdit={() => onOpenEdit("personal")} />
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                <InfoCell label="First Name" value={profile.firstName} />
                <InfoCell label="Last Name" value={profile.lastName} />
                <InfoCell label="Birthday" value={profile.birthdate} />
                <InfoCell label="Contact No" value={profile.contactNo} />
                <InfoCell label="Email" value={profile.email} className="md:col-span-2" />
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[#162544] dark:bg-[#0B1220]">
              <CardHeader title="Address" onEdit={() => onOpenEdit("address")} />
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                <InfoCell label="Country" value={profile.country} />
                <InfoCell label="City/State" value={profile.municipality} />
                <InfoCell label="Barangay" value={profile.barangay} />
                <InfoCell label="Postal Code" value={profile.postalCode} />
              </div>
            </section>
          </>
        )}
      </div>

      <Modal
        open={editSection === "personal"}
        title="Edit Personal Information"
        subtitle="Update your personal details"
        onClose={onCloseEdit}
        maxWidthClassName="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCloseEdit}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
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
              className={inputClassName}
            />
            {fieldErrors.firstName ? (
              <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.firstName}</div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Last name</label>
            <input
              value={form.lastName}
              onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
              className={inputClassName}
            />
            {fieldErrors.lastName ? (
              <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.lastName}</div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Birthday</label>
            <input
              type="date"
              value={form.birthdate || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, birthdate: e.target.value }))}
              className={inputClassName}
            />
            {fieldErrors.birthdate ? (
              <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.birthdate}</div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Contact no</label>
            <input
              value={form.contactNo || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, contactNo: e.target.value }))}
              className={inputClassName}
            />
            {fieldErrors.contactNo ? (
              <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.contactNo}</div>
            ) : null}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className={inputClassName}
            />
            {fieldErrors.email ? (
              <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.email}</div>
            ) : null}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">LGU Position</label>
            <input
              value={form.position || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
              className={inputClassName}
            />
            {fieldErrors.position ? (
              <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.position}</div>
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal
        open={editSection === "address"}
        title="Edit Address"
        subtitle="Update your location details"
        onClose={onCloseEdit}
        maxWidthClassName="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCloseEdit}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
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
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Country</label>
            <input
              value={form.country || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
              className={inputClassName}
            />
            {fieldErrors.country ? (
              <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.country}</div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">City/State</label>
            <input
              value={form.municipality || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, municipality: e.target.value }))}
              className={inputClassName}
            />
            {fieldErrors.municipality ? (
              <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.municipality}</div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Barangay</label>
            <input
              value={form.barangay || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, barangay: e.target.value }))}
              className={inputClassName}
            />
            {fieldErrors.barangay ? (
              <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.barangay}</div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Postal code</label>
            <input
              value={form.postalCode || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, postalCode: e.target.value }))}
              className={inputClassName}
            />
            {fieldErrors.postalCode ? (
              <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.postalCode}</div>
            ) : null}
          </div>
        </div>
      </Modal>
    </>
  );
}
