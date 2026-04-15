import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import type {
  CreateResponderTeamPayload,
  ResponderMemberOption,
  ResponderTeamDetails,
  UpdateResponderTeamPayload,
} from "../models/responderTeam.types";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  loading: boolean;
  saving: boolean;
  team: ResponderTeamDetails | null;
  responderOptions: ResponderMemberOption[];
  responderOptionsLoading: boolean;
  isLgu: boolean;
  defaultBarangay?: string;
  onClose: () => void;
  onCreate: (payload: CreateResponderTeamPayload) => Promise<void>;
  onUpdate: (payload: UpdateResponderTeamPayload) => Promise<void>;
};

type FormState = {
  name: string;
  code: string;
  description: string;
  barangay: string;
  municipality: string;
  memberIds: string[];
  leaderId: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function blankForm(defaultBarangay: string): FormState {
  return {
    name: "",
    code: "",
    description: "",
    barangay: defaultBarangay,
    municipality: "Dagupan City",
    memberIds: [],
    leaderId: "",
  };
}

function safeStr(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptional(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export default function ResponderTeamFormModal({
  open,
  mode,
  loading,
  saving,
  team,
  responderOptions,
  responderOptionsLoading,
  isLgu,
  defaultBarangay = "",
  onClose,
  onCreate,
  onUpdate,
}: Props) {
  const [form, setForm] = useState<FormState>(() => blankForm(defaultBarangay));
  const [errors, setErrors] = useState<FormErrors>({});
  const [memberQuery, setMemberQuery] = useState("");

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && team) {
      setForm({
        name: team.name,
        code: team.code ?? "",
        description: team.description ?? "",
        barangay: team.barangay || defaultBarangay,
        municipality: team.municipality || "Dagupan City",
        memberIds: [...(team.memberIds ?? [])],
        leaderId: team.leader?.id ?? "",
      });
      setErrors({});
      setMemberQuery("");
      return;
    }

    setForm(blankForm(defaultBarangay));
    setErrors({});
    setMemberQuery("");
  }, [open, mode, team, defaultBarangay]);

  useEffect(() => {
    if (!form.leaderId) return;
    if (form.memberIds.includes(form.leaderId)) return;
    setForm((prev) => ({ ...prev, leaderId: "" }));
  }, [form.memberIds, form.leaderId]);

  const membersLocked = mode === "edit" && team?.isActive === false;

  const title = mode === "create" ? "Create Team" : "Edit Team";
  const subtitle =
    mode === "create"
      ? "Create a responder team and assign members"
      : "Update team details, leader, and member assignment";

  const submitLabel = mode === "create" ? "Create" : "Save";

  const memberLookup = useMemo(() => {
    const map = new Map<string, ResponderMemberOption>();

    for (const option of responderOptions) {
      map.set(option.id, option);
    }

    for (const member of team?.members ?? []) {
      map.set(member.id, {
        id: member.id,
        lifelineId: member.lifelineId,
        username: member.username,
        fullName: member.name,
        email: member.email,
        barangay: safeStr(member.barangay) || safeStr(team?.barangay),
        municipality: safeStr(team?.municipality) || "Dagupan City",
        onDuty: member.onDuty,
        isActive: member.isActive,
      });
    }

    return map;
  }, [responderOptions, team]);

  const barangayScopedOptions = useMemo(() => {
    const barangay = safeStr(form.barangay).toLowerCase();
    if (!barangay) return responderOptions;

    return responderOptions.filter(
      (option) => safeStr(option.barangay).toLowerCase() === barangay
    );
  }, [form.barangay, responderOptions]);

  const visibleOptions = useMemo(() => {
    const q = safeStr(memberQuery).toLowerCase();
    if (!q) return barangayScopedOptions;

    return barangayScopedOptions.filter((option) => {
      const haystack = `${option.fullName} ${option.username ?? ""} ${option.lifelineId ?? ""} ${option.email ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [barangayScopedOptions, memberQuery]);

  const selectedMembers = useMemo(() => {
    return form.memberIds.map((id) => {
      const member = memberLookup.get(id);
      if (member) return member;

      return {
        id,
        fullName: "Responder",
        barangay: safeStr(form.barangay),
        municipality: safeStr(form.municipality) || "Dagupan City",
        onDuty: false,
        isActive: true,
      } as ResponderMemberOption;
    });
  }, [form.barangay, form.memberIds, form.municipality, memberLookup]);

  const validationErrors = useMemo(() => {
    const next: FormErrors = {};

    if (!safeStr(form.name)) next.name = "Team name is required.";
    if (safeStr(form.name).length > 0 && safeStr(form.name).length < 2) {
      next.name = "Team name must be at least 2 characters.";
    }

    if (!safeStr(form.barangay)) next.barangay = "Barangay is required.";
    if (!safeStr(form.municipality)) next.municipality = "Municipality is required.";

    if (form.leaderId && !form.memberIds.includes(form.leaderId)) {
      next.leaderId = "Leader must be selected from current members.";
    }

    return next;
  }, [form]);

  function toggleMember(memberId: string) {
    if (membersLocked) return;

    setForm((prev) => {
      if (prev.memberIds.includes(memberId)) {
        return {
          ...prev,
          memberIds: prev.memberIds.filter((id) => id !== memberId),
        };
      }

      return {
        ...prev,
        memberIds: [...prev.memberIds, memberId],
      };
    });
  }

  async function onSubmit() {
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const base = {
      name: safeStr(form.name),
      code: normalizeOptional(form.code),
      description: normalizeOptional(form.description),
      barangay: normalizeOptional(form.barangay),
      municipality: normalizeOptional(form.municipality) ?? "Dagupan City",
      memberIds: [...form.memberIds],
    };

    if (mode === "create") {
      await onCreate({
        ...base,
        ...(form.leaderId ? { leaderId: form.leaderId } : {}),
      });
      return;
    }

    await onUpdate({
      ...base,
      leaderId: form.leaderId || null,
    });
  }

  return (
    <Modal
      open={open}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      maxWidthClassName="max-w-5xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
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
          Loading team details...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">
                  Team Name
                </label>
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
                  placeholder="Dagupan Response Team Alpha"
                />
                {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">
                  Team Code
                </label>
                <input
                  value={form.code}
                  onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
                  placeholder="DGT-ALPHA"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
                placeholder="Optional team notes"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">
                  Barangay
                </label>
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">
                  Municipality
                </label>
                <input
                  value={form.municipality}
                  onChange={(event) => setForm((prev) => ({ ...prev, municipality: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
                  placeholder="Dagupan City"
                />
                {errors.municipality ? (
                  <p className="mt-1 text-xs text-red-600">{errors.municipality}</p>
                ) : null}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">
                Team Leader
              </label>
              <select
                value={form.leaderId}
                disabled={membersLocked}
                onChange={(event) => setForm((prev) => ({ ...prev, leaderId: event.target.value }))}
                className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100 dark:disabled:bg-[#0A1323]"
              >
                <option value="">No leader</option>
                {selectedMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.fullName}
                    {member.lifelineId ? ` (${member.lifelineId})` : ""}
                  </option>
                ))}
              </select>
              {errors.leaderId ? <p className="mt-1 text-xs text-red-600">{errors.leaderId}</p> : null}
            </div>

            {membersLocked ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                This team is archived. Restore it first before changing members or leader assignment.
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">
                Team Members ({form.memberIds.length})
              </label>
              {responderOptionsLoading ? (
                <span className="text-xs text-gray-500 dark:text-slate-500">Loading responders...</span>
              ) : null}
            </div>

            <input
              value={memberQuery}
              disabled={membersLocked}
              onChange={(event) => setMemberQuery(event.target.value)}
              placeholder="Search by name, username, lifeline ID, or email"
              className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100 dark:disabled:bg-[#0A1323]"
            />

            <div className="max-h-[320px] overflow-y-auto rounded-md border border-gray-200 bg-white dark:border-[#162544] dark:bg-[#0E1626]">
              {visibleOptions.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-600 dark:text-slate-400">
                  No responders match the current barangay/filter.
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-[#162544]">
                  {visibleOptions.map((option) => {
                    const checked = form.memberIds.includes(option.id);
                    return (
                      <label
                        key={option.id}
                        className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-[#122036]"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={membersLocked}
                          onChange={() => toggleMember(option.id)}
                          className="mt-1 h-4 w-4 accent-blue-600"
                        />
                        <div className="min-w-0 text-sm">
                          <div className="font-semibold text-gray-900 dark:text-slate-100">
                            {option.fullName}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-slate-400">
                            {option.lifelineId ? `${option.lifelineId} • ` : ""}
                            {option.username ? `@${option.username}` : "No username"}
                            {option.email ? ` • ${option.email}` : ""}
                          </div>
                          <div className="mt-0.5 text-xs text-gray-500 dark:text-slate-500">
                            {option.barangay}, {option.municipality}
                            {option.onDuty ? " • On duty" : " • Off duty"}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}


