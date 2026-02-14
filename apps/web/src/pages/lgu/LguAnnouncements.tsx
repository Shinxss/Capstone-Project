import { useMemo, useState } from "react";
import LguShell from "../../components/lgu/LguShell";
import Modal from "../../components/ui/Modal";
import InlineAlert from "../../components/ui/InlineAlert";
import { useLguAnnouncements } from "../../features/announcements/hooks/useLguAnnouncements";
import type { Announcement, AnnouncementAudience, AnnouncementDraftInput } from "../../features/announcements/models/announcements.types";

function StatusPill({ status }: { status: string }) {
  const s = String(status || "").toUpperCase();
  const cls =
    s === "PUBLISHED"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900/50"
      : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-[#0E1626] dark:text-slate-200 dark:border-[#162544]";
  return (
    <span className={["inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold", cls].join(" ")}>
      {s}
    </span>
  );
}

function audienceLabel(a: AnnouncementAudience) {
  switch (a) {
    case "LGU":
      return "LGU Staff";
    case "VOLUNTEERS":
      return "Volunteers";
    case "BARANGAY":
      return "Barangay";
    case "ALL":
      return "All";
    default:
      return a;
  }
}

export default function LguAnnouncements() {
  const vm = useLguAnnouncements();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  const [form, setForm] = useState<AnnouncementDraftInput>({
    title: "",
    body: "",
    audience: "LGU",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");

  const title = editing ? "Edit Announcement" : "New Announcement";
  const subtitle = editing ? "Update and save changes" : "Create an announcement draft";

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", body: "", audience: "LGU" });
    setFieldErrors({});
    setEditorOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, body: a.body, audience: a.audience });
    setFieldErrors({});
    setEditorOpen(true);
  };

  const rows = useMemo(() => vm.announcements, [vm.announcements]);

  return (
    <LguShell title="Announcements" subtitle="Publish updates within LGU scope">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">{rows.length} total</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">Draft, publish, and manage announcements</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={vm.refresh}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
          >
            Refresh
          </button>
          <button
            onClick={openCreate}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            New
          </button>
        </div>
      </div>

      {vm.error ? (
        <div className="mt-4">
          <InlineAlert variant="error" title="Announcements">
            {vm.error}
          </InlineAlert>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
          No announcements yet.
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white dark:bg-[#0B1220] dark:border-[#162544]">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-[#0E1626] dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Audience</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-[#0E1626]">
                  <td className="px-4 py-3">
                    <div className="font-extrabold text-gray-900 dark:text-slate-100">{a.title}</div>
                    <div className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">
                      {a.body.length > 90 ? a.body.slice(0, 90) + "..." : a.body}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{audienceLabel(a.audience)}</td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                    {a.createdAt ? new Date(a.createdAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {a.status === "PUBLISHED" ? (
                        <button
                          type="button"
                          onClick={() => vm.unpublish(a.id)}
                          disabled={vm.busyId === a.id}
                          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
                        >
                          {vm.busyId === a.id ? "Working..." : "Unpublish"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => vm.publish(a.id)}
                          disabled={vm.busyId === a.id}
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {vm.busyId === a.id ? "Working..." : "Publish"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEdit(a)}
                        className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeleteId(a.id);
                          setDeleteOpen(true);
                        }}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
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
      )}

      <Modal
        open={editorOpen}
        title={title}
        subtitle={subtitle}
        onClose={() => setEditorOpen(false)}
        maxWidthClassName="max-w-3xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setFieldErrors({});
                const res = editing ? vm.update(editing.id, form) : vm.create(form);
                if (!res.ok) {
                  setFieldErrors(res.errors as any);
                  return;
                }
                setEditorOpen(false);
              }}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
              placeholder="Announcement title"
            />
            {fieldErrors.title ? <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.title}</div> : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Audience</label>
            <select
              value={form.audience}
              onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value as AnnouncementAudience }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            >
              {vm.audiences.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            {fieldErrors.audience ? <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.audience}</div> : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Body</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              className="mt-1 w-full min-h-40 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
              placeholder="Write the announcement..."
            />
            {fieldErrors.body ? <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.body}</div> : null}
          </div>

          <div className="text-[11px] text-gray-500 dark:text-slate-500">
            Announcements are stored locally for now. When a backend endpoint is available, move persistence into an API service.
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteOpen && !!deleteId}
        title="Delete Announcement"
        subtitle="This cannot be undone"
        onClose={() => {
          setDeleteOpen(false);
          setDeleteId("");
        }}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteId("");
              }}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
              disabled={!!vm.busyId}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                await vm.remove(deleteId);
                setDeleteOpen(false);
                setDeleteId("");
              }}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
              disabled={!!vm.busyId}
            >
              Delete
            </button>
          </div>
        }
      >
        <div className="text-sm text-gray-700 dark:text-slate-300">
          Delete this announcement permanently.
        </div>
      </Modal>
    </LguShell>
  );
}

