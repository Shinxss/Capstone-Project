import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import type {
  CreateResponderAccountPayload,
  ResponderAccountDetails,
  UpdateResponderAccountPayload,
} from "../models/responderAccount.types";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  loading: boolean;
  saving: boolean;
  account: ResponderAccountDetails | null;
  isLgu: boolean;
  defaultBarangay?: string;
  onClose: () => void;
  onCreate: (payload: CreateResponderAccountPayload) => Promise<void>;
  onUpdate: (payload: UpdateResponderAccountPayload) => Promise<void>;
};

type FormState = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNo: string;
  barangay: string;
  municipality: string;
  skills: string;
  onDuty: boolean;
  isActive: boolean;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function blankForm(defaultBarangay: string): FormState {
  return {
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    contactNo: "",
    barangay: defaultBarangay,
    municipality: "Dagupan City",
    skills: "",
    onDuty: true,
    isActive: true,
  };
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizeOptional(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export default function ResponderAccountFormModal({
  open,
  mode,
  loading,
  saving,
  account,
  isLgu,
  defaultBarangay = "",
  onClose,
  onCreate,
  onUpdate,
}: Props) {
  const [form, setForm] = useState<FormState>(() => blankForm(defaultBarangay));
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && account) {
      setForm({
        username: account.username ?? "",
        password: "",
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email ?? "",
        contactNo: account.contactNo ?? "",
        barangay: account.barangay || defaultBarangay,
        municipality: account.municipality || "Dagupan City",
        skills: account.skills ?? "",
        onDuty: account.onDuty,
        isActive: account.isActive,
      });
      setErrors({});
      return;
    }

    setForm(blankForm(defaultBarangay));
    setErrors({});
  }, [open, mode, account, defaultBarangay]);

  const title = mode === "create" ? "Add Responder" : "Edit Responder";
  const subtitle =
    mode === "create"
      ? "Create a responder account for dispatch operations"
      : "Update responder account information";

  const submitLabel = mode === "create" ? "Create" : "Save";

  const validationErrors = useMemo(() => {
    const next: FormErrors = {};

    if (!form.username.trim()) next.username = "Username is required.";
    if (form.username.trim().length < 3) next.username = "Username must be at least 3 characters.";

    if (mode === "create" && !form.password.trim()) {
      next.password = "Password is required.";
    }
    if (form.password && form.password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }

    if (!form.firstName.trim()) next.firstName = "First name is required.";
    if (!form.lastName.trim()) next.lastName = "Last name is required.";
    if (!form.barangay.trim()) next.barangay = "Barangay is required.";
    if (!form.municipality.trim()) next.municipality = "Municipality is required.";

    if (!isValidEmail(normalizeEmail(form.email))) {
      next.email = "Enter a valid email address.";
    }

    return next;
  }, [form, mode]);

  async function onSubmit() {
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const base = {
      username: form.username.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: sanitizeOptional(normalizeEmail(form.email)),
      contactNo: sanitizeOptional(form.contactNo),
      barangay: sanitizeOptional(form.barangay),
      municipality: sanitizeOptional(form.municipality) ?? "Dagupan City",
      skills: sanitizeOptional(form.skills),
      onDuty: form.onDuty,
      isActive: form.isActive,
    };

    if (mode === "create") {
      await onCreate({
        ...base,
        password: form.password,
      });
      return;
    }

    const payload: UpdateResponderAccountPayload = {
      ...base,
      ...(form.password.trim() ? { password: form.password } : {}),
    };

    await onUpdate(payload);
  }

  return (
    <Modal
      open={open}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      maxWidthClassName="max-w-3xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              void onSubmit();
            }}
            disabled={saving || loading}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : submitLabel}
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300">
          Loading responder details...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Username</label>
            <input
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
              placeholder="responder.username"
            />
            {errors.username ? <p className="mt-1 text-xs text-red-600">{errors.username}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">
              Password {mode === "edit" ? "(leave blank to keep current)" : ""}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
              placeholder={mode === "create" ? "At least 8 characters" : "Optional password reset"}
            />
            {errors.password ? <p className="mt-1 text-xs text-red-600">{errors.password}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">First Name</label>
            <input
              value={form.firstName}
              onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
              placeholder="Juan"
            />
            {errors.firstName ? <p className="mt-1 text-xs text-red-600">{errors.firstName}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Last Name</label>
            <input
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
              placeholder="Dela Cruz"
            />
            {errors.lastName ? <p className="mt-1 text-xs text-red-600">{errors.lastName}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Email</label>
            <input
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
              placeholder="Optional"
            />
            {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Contact Number</label>
            <input
              value={form.contactNo}
              onChange={(event) => setForm((prev) => ({ ...prev, contactNo: event.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Barangay</label>
            <input
              value={form.barangay}
              disabled={isLgu}
              onChange={(event) => setForm((prev) => ({ ...prev, barangay: event.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100 dark:disabled:bg-[#0A1323]"
              placeholder="Barangay"
            />
            {errors.barangay ? <p className="mt-1 text-xs text-red-600">{errors.barangay}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Municipality</label>
            <input
              value={form.municipality}
              onChange={(event) => setForm((prev) => ({ ...prev, municipality: event.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
              placeholder="Dagupan City"
            />
            {errors.municipality ? <p className="mt-1 text-xs text-red-600">{errors.municipality}</p> : null}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Skills</label>
            <textarea
              value={form.skills}
              onChange={(event) => setForm((prev) => ({ ...prev, skills: event.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
              placeholder="Medical, Search and Rescue, Logistics"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="responder-on-duty"
              type="checkbox"
              checked={form.onDuty}
              onChange={(event) => setForm((prev) => ({ ...prev, onDuty: event.target.checked }))}
              className="h-4 w-4 accent-blue-600"
            />
            <label htmlFor="responder-on-duty" className="text-sm text-gray-700 dark:text-slate-200">
              On duty
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="responder-active"
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              className="h-4 w-4 accent-blue-600"
            />
            <label htmlFor="responder-active" className="text-sm text-gray-700 dark:text-slate-200">
              Active account
            </label>
          </div>
        </div>
      )}
    </Modal>
  );
}
