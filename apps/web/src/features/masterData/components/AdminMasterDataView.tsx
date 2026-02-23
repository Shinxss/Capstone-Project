import { useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import type { useAdminMasterData } from "../hooks/useAdminMasterData";
import type { MasterDataRecord, MasterDataTab } from "../models/masterData.types";

type Props = ReturnType<typeof useAdminMasterData>;

const tabs: Array<{ key: MasterDataTab; label: string }> = [
  { key: "emergency-types", label: "Emergency Types" },
  { key: "severity-levels", label: "Severity Levels" },
  { key: "task-templates", label: "Task Templates" },
  { key: "workflows", label: "Workflows" },
];

type FormState = {
  code: string;
  label: string;
  rank: string;
  isActive: boolean;
  checklistItems: string;
  entityType: "emergency" | "dispatch" | "volunteerApplication";
  states: string;
  transitions: string;
};

function defaultForm(): FormState {
  return {
    code: "",
    label: "",
    rank: "1",
    isActive: true,
    checklistItems: "",
    entityType: "emergency",
    states: "",
    transitions: "",
  };
}

function buildPayload(tab: MasterDataTab, form: FormState): Record<string, unknown> {
  if (tab === "emergency-types") {
    return { code: form.code.trim(), label: form.label.trim(), isActive: form.isActive };
  }

  if (tab === "severity-levels") {
    return {
      code: form.code.trim(),
      label: form.label.trim(),
      rank: Number(form.rank || "1"),
      isActive: form.isActive,
    };
  }

  if (tab === "task-templates") {
    return {
      code: form.code.trim(),
      label: form.label.trim(),
      checklistItems: form.checklistItems
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),
      isActive: form.isActive,
    };
  }

  return {
    entityType: form.entityType,
    states: form.states
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean),
    transitions: form.transitions
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [from = "", to = ""] = line.split("->").map((value) => value.trim());
        return { from, to };
      })
      .filter((row) => row.from && row.to),
  };
}

function hydrateForm(tab: MasterDataTab, record: MasterDataRecord): FormState {
  if (tab === "workflows") {
    return {
      ...defaultForm(),
      entityType: record.entityType ?? "emergency",
      states: (record.states ?? []).join("\n"),
      transitions: (record.transitions ?? []).map((row) => `${row.from} -> ${row.to}`).join("\n"),
    };
  }

  return {
    ...defaultForm(),
    code: record.code ?? "",
    label: record.label ?? "",
    rank: String(record.rank ?? 1),
    isActive: record.isActive ?? true,
    checklistItems: (record.checklistItems ?? []).join("\n"),
  };
}

export default function AdminMasterDataView({ tab, setTab, items, loading, error, busyId, refresh, create, update }: Props) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<MasterDataRecord | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());

  const title = useMemo(() => tabs.find((entry) => entry.key === tab)?.label ?? tab, [tab]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm());
    setEditorOpen(true);
  };

  const openEdit = (record: MasterDataRecord) => {
    setEditing(record);
    setForm(hydrateForm(tab, record));
    setEditorOpen(true);
  };

  async function onSave() {
    const payload = buildPayload(tab, form);
    if (editing?._id) {
      await update(editing._id, payload);
    } else {
      await create(payload);
    }
    setEditorOpen(false);
  }

  return (
    <>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => setTab(entry.key)}
              className={[
                "rounded-md border px-3 py-1.5 text-sm font-semibold transition",
                tab === entry.key
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]",
              ].join(" ")}
            >
              {entry.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => void refresh()}
            className="ml-auto rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            New record
          </button>
        </div>

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
            Loading {title.toLowerCase()}...
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
                  <th className="px-4 py-3">Primary</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
                {items.map((item) => (
                  <tr key={item._id}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 dark:text-slate-100">
                        {tab === "workflows" ? item.entityType : item.label || item.code || "-"}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-slate-400">{item.code || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                      {tab === "severity-levels" ? `Rank: ${item.rank ?? "-"}` : null}
                      {tab === "task-templates" ? `Checklist items: ${(item.checklistItems ?? []).length}` : null}
                      {tab === "workflows" ? `States: ${(item.states ?? []).length}, transitions: ${(item.transitions ?? []).length}` : null}
                      {tab !== "workflows" ? `Active: ${item.isActive ? "Yes" : "No"}` : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? `Edit ${title}` : `New ${title}`}
        subtitle="Use line breaks for list-based fields."
        maxWidthClassName="max-w-3xl"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void onSave()}
              disabled={busyId === (editing?._id ?? "new")}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Save
            </button>
          </div>
        }
      >
        {tab !== "workflows" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} placeholder="Code" className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100" />
            <input value={form.label} onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))} placeholder="Label" className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100" />
            {tab === "severity-levels" ? (
              <input value={form.rank} onChange={(event) => setForm((prev) => ({ ...prev, rank: event.target.value }))} placeholder="Rank" type="number" className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100" />
            ) : null}
            {tab === "task-templates" ? (
              <textarea value={form.checklistItems} onChange={(event) => setForm((prev) => ({ ...prev, checklistItems: event.target.value }))} placeholder="Checklist items (one per line)" className="min-h-32 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100 sm:col-span-2" />
            ) : null}
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300 sm:col-span-2">
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} className="h-4 w-4" />
              Active
            </label>
          </div>
        ) : (
          <div className="grid gap-3">
            <select
              value={form.entityType}
              onChange={(event) => setForm((prev) => ({ ...prev, entityType: event.target.value as FormState["entityType"] }))}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
            >
              <option value="emergency">emergency</option>
              <option value="dispatch">dispatch</option>
              <option value="volunteerApplication">volunteerApplication</option>
            </select>
            <textarea value={form.states} onChange={(event) => setForm((prev) => ({ ...prev, states: event.target.value }))} placeholder="States (one per line)" className="min-h-24 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100" />
            <textarea value={form.transitions} onChange={(event) => setForm((prev) => ({ ...prev, transitions: event.target.value }))} placeholder="Transitions (one per line: from -> to)" className="min-h-24 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100" />
          </div>
        )}
      </Modal>
    </>
  );
}
