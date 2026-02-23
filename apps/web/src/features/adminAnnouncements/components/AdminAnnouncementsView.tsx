import { useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useConfirm } from "@/features/feedback/hooks/useConfirm";
import type { AdminAnnouncement, AdminAnnouncementAudience, AdminAnnouncementDraftInput } from "../models/adminAnnouncements.types";
import { useAdminAnnouncements } from "../hooks/useAdminAnnouncements";

type Props = ReturnType<typeof useAdminAnnouncements>;

const audienceOptions: Array<{ value: AdminAnnouncementAudience; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "LGU", label: "LGU" },
  { value: "VOLUNTEER", label: "Volunteer" },
  { value: "PUBLIC", label: "Public" },
];

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
] as const;

function statusPill(status: string) {
  return status === "PUBLISHED"
    ? "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
    : "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:bg-[#122036] dark:text-slate-300";
}

function mapAudienceLabel(value: AdminAnnouncementAudience) {
  const found = audienceOptions.find((option) => option.value === value);
  return found?.label ?? value;
}

function defaultForm(): AdminAnnouncementDraftInput {
  return {
    title: "",
    body: "",
    audience: "ALL",
    status: "DRAFT",
  };
}

export default function AdminAnnouncementsView({
  items,
  loading,
  error,
  busyId,
  status,
  setStatus,
  q,
  setQ,
  refresh,
  create,
  update,
  publish,
  unpublish,
  remove,
}: Props) {
  const confirm = useConfirm();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAnnouncement | null>(null);
  const [form, setForm] = useState<AdminAnnouncementDraftInput>(defaultForm());

  const filteredItems = useMemo(() => items, [items]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm());
    setEditorOpen(true);
  };

  const openEdit = (item: AdminAnnouncement) => {
    setEditing(item);
    setForm({
      title: item.title,
      body: item.body,
      audience: item.audience,
      status: item.status,
    });
    setEditorOpen(true);
  };

  async function onSave() {
    if (!form.title.trim() || !form.body.trim()) return;
    if (editing) {
      await update(editing.id, form);
    } else {
      await create(form);
    }
    setEditorOpen(false);
  }

  async function requestDelete(item: AdminAnnouncement) {
    const ok = await confirm({
      title: "Delete announcement?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
    });
    if (!ok) return;
    await remove(item.id);
  }

  async function requestUnpublish(item: AdminAnnouncement) {
    const ok = await confirm({
      title: "Unpublish announcement?",
      description: `"${item.title}" will move back to draft.`,
      confirmText: "Unpublish",
    });
    if (!ok) return;
    await unpublish(item.id);
  }

  return (
    <>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search title or body"
              className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 sm:w-72 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
              className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
            <button
              type="button"
              onClick={openCreate}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              New announcement
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
            Loading announcements...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : null}

        {!loading && !error ? (
          filteredItems.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-[#162544] dark:bg-[#0B1220]">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-[#0E1626] dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Audience</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-slate-100">{item.title}</div>
                        <div className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-slate-400">{item.body}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{mapAudienceLabel(item.audience)}</td>
                      <td className="px-4 py-3">
                        <span className={statusPill(item.status)}>{item.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{new Date(item.updatedAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
                          >
                            Edit
                          </button>
                          {item.status === "PUBLISHED" ? (
                            <button
                              type="button"
                              onClick={() => void requestUnpublish(item)}
                              disabled={busyId === item.id}
                              className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void publish(item.id)}
                              disabled={busyId === item.id}
                              className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              Publish
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void requestDelete(item)}
                            disabled={busyId === item.id}
                            className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
              No announcements found.
            </div>
          )
        ) : null}
      </div>

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? "Edit announcement" : "New announcement"}
        subtitle="Draft and publish updates for LGUs, volunteers, and public audience."
        maxWidthClassName="max-w-2xl"
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
              disabled={busyId === (editing?.id ?? "new") || !form.title.trim() || !form.body.trim()}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Save
            </button>
          </div>
        }
      >
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-slate-200">Title</label>
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
              placeholder="Announcement title"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-slate-200">Audience</label>
            <select
              value={form.audience}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, audience: event.target.value as AdminAnnouncementAudience }))
              }
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
            >
              {audienceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-slate-200">Body</label>
            <textarea
              value={form.body}
              onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
              className="min-h-36 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
              placeholder="Write announcement details"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
