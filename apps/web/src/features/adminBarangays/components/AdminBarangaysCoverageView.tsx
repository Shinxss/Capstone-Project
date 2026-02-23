import { useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useConfirm } from "@/features/feedback/hooks/useConfirm";
import type { AdminBarangay } from "../models/adminBarangays.types";
import type { useAdminBarangays } from "../hooks/useAdminBarangays";

type Props = ReturnType<typeof useAdminBarangays>;

type FormState = {
  name: string;
  city: string;
  province: string;
  code: string;
};

function defaultForm(): FormState {
  return {
    name: "",
    city: "Dagupan City",
    province: "Pangasinan",
    code: "",
  };
}

export default function AdminBarangaysCoverageView({ items, loading, error, busyId, q, setQ, refresh, create, update, toggleActive }: Props) {
  const confirm = useConfirm();
  const [editorOpen, setEditorOpen] = useState(false);
  const [geometryOpen, setGeometryOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBarangay | null>(null);
  const [geometryTarget, setGeometryTarget] = useState<AdminBarangay | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());

  const title = useMemo(() => (editing ? "Edit Barangay" : "Create Barangay"), [editing]);

  function openCreate() {
    setEditing(null);
    setForm(defaultForm());
    setEditorOpen(true);
  }

  function openEdit(item: AdminBarangay) {
    setEditing(item);
    setForm({
      name: item.name,
      city: item.city,
      province: item.province,
      code: item.code ?? "",
    });
    setEditorOpen(true);
  }

  async function onSave() {
    if (!form.name.trim()) return;
    if (editing) {
      await update(editing.id, {
        name: form.name.trim(),
        city: form.city.trim(),
        province: form.province.trim(),
        code: form.code.trim() || undefined,
      });
    } else {
      await create({
        name: form.name.trim(),
        city: form.city.trim() || "Dagupan City",
        province: form.province.trim() || "Pangasinan",
        code: form.code.trim() || undefined,
      });
    }
    setEditorOpen(false);
  }

  return (
    <>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search barangay"
            className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 sm:w-80 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              New barangay
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
            Loading barangays...
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
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 dark:text-slate-100">{item.name}</div>
                      <div className="text-xs text-gray-600 dark:text-slate-400">
                        {item.city}, {item.province}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{item.code || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          item.isActive
                            ? "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                            : "inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-500/20 dark:text-red-300"
                        }
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
                        >
                          Edit
                        </button>
                        {item.geometry ? (
                          <button
                            type="button"
                            onClick={() => {
                              setGeometryTarget(item);
                              setGeometryOpen(true);
                            }}
                            className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
                          >
                            View boundary
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() =>
                            void (async () => {
                              const ok = await confirm({
                                title: item.isActive ? "Deactivate barangay?" : "Activate barangay?",
                                description: item.name,
                                confirmText: item.isActive ? "Deactivate" : "Activate",
                                variant: item.isActive ? "destructive" : "default",
                              });
                              if (!ok) return;
                              await toggleActive(item);
                            })()
                          }
                          disabled={busyId === item.id}
                          className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
                        >
                          {busyId === item.id ? "Working..." : item.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
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
        title={title}
        subtitle="Manage barangay records and coverage metadata."
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
              disabled={busyId === (editing?.id ?? "new") || !form.name.trim()}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Save
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Barangay name"
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
          />
          <input
            value={form.code}
            onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
            placeholder="Code (optional)"
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
          />
          <input
            value={form.city}
            onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
            placeholder="City"
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
          />
          <input
            value={form.province}
            onChange={(event) => setForm((prev) => ({ ...prev, province: event.target.value }))}
            placeholder="Province"
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
          />
        </div>
      </Modal>

      <Modal
        open={geometryOpen}
        onClose={() => setGeometryOpen(false)}
        title={`Boundary: ${geometryTarget?.name ?? ""}`}
        subtitle="GeoJSON geometry preview"
        maxWidthClassName="max-w-4xl"
      >
        <pre className="max-h-[70vh] overflow-auto rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300">
          {JSON.stringify(geometryTarget?.geometry ?? null, null, 2)}
        </pre>
      </Modal>
    </>
  );
}
