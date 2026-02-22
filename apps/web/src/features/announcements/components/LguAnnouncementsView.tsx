import { useMemo, useState } from "react";
import { Megaphone } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import EmptyState from "../../../components/ui/EmptyState";
import type { Announcement, AnnouncementAudience, AnnouncementDraftInput } from "../models/announcements.types";
import { useLguAnnouncements } from "../hooks/useLguAnnouncements";
import { useConfirm } from "@/features/feedback/hooks/useConfirm";

type Props = ReturnType<typeof useLguAnnouncements> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function StatusPill({ status }: { status: string }) {
  const normalized = String(status || "").toUpperCase();
  const cls =
    normalized === "PUBLISHED"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900/50"
      : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-[#0E1626] dark:text-slate-200 dark:border-[#162544]";

  return (
    <span className={["inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold", cls].join(" ")}>
      {normalized}
    </span>
  );
}

function audienceLabel(audience: AnnouncementAudience) {
  switch (audience) {
    case "LGU":
      return "LGU Staff";
    case "VOLUNTEERS":
      return "Volunteers";
    case "BARANGAY":
      return "Barangay";
    case "ALL":
      return "All";
    default:
      return audience;
  }
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

export default function LguAnnouncementsView(props: Props) {
  const confirm = useConfirm();
  const { loading, error, onRefresh, announcements, audiences, busyId, create, update, publish, unpublish, remove } = props;

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState<AnnouncementDraftInput>({
    title: "",
    body: "",
    audience: "LGU",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const rows = useMemo(() => announcements, [announcements]);

  const editorTitle = editing ? "Edit Announcement" : "New Announcement";
  const editorSubtitle = editing ? "Update and save changes" : "Create an announcement draft";

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", body: "", audience: "LGU" });
    setFieldErrors({});
    setEditorOpen(true);
  };

  const openEdit = (announcement: Announcement) => {
    setEditing(announcement);
    setForm({
      title: announcement.title,
      body: announcement.body,
      audience: announcement.audience,
    });
    setFieldErrors({});
    setEditorOpen(true);
  };

  const requestDelete = async (announcement: Announcement) => {
    const ok = await confirm({
      title: "Are you sure you want to delete?",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (!ok) return;
    await remove(announcement.id);
  };

  const requestUnpublish = async (announcement: Announcement) => {
    const ok = await confirm({
      title: "Unpublish announcement?",
      description: `Are you sure you want to unpublish "${announcement.title}"?`,
      confirmText: "Unpublish",
      cancelText: "Cancel",
      variant: "default",
    });

    if (!ok) return;
    await unpublish(announcement.id);
  };

  if (loading) return <LoadingPanel />;
  if (error) return <ErrorPanel error={error} onRetry={onRefresh} />;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">{rows.length} total</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">Draft, publish, and manage announcements</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
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

      {rows.length === 0 ? (
        <EmptyState className="mt-4" icon={Megaphone} title="No announcements yet." />
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
              {rows.map((announcement) => (
                <tr key={announcement.id} className="hover:bg-gray-50 dark:hover:bg-[#0E1626]">
                  <td className="px-4 py-3">
                    <div className="font-extrabold text-gray-900 dark:text-slate-100">{announcement.title}</div>
                    <div className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">
                      {announcement.body.length > 90 ? `${announcement.body.slice(0, 90)}...` : announcement.body}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={announcement.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{audienceLabel(announcement.audience)}</td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                    {announcement.createdAt ? new Date(announcement.createdAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {announcement.status === "PUBLISHED" ? (
                        <button
                          type="button"
                          onClick={() => void requestUnpublish(announcement)}
                          disabled={busyId === announcement.id}
                          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
                        >
                          {busyId === announcement.id ? "Working..." : "Unpublish"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void publish(announcement.id)}
                          disabled={busyId === announcement.id}
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {busyId === announcement.id ? "Working..." : "Publish"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEdit(announcement)}
                        className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => void requestDelete(announcement)}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                        disabled={busyId === announcement.id}
                      >
                        {busyId === announcement.id ? "Working..." : "Delete"}
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
        title={editorTitle}
        subtitle={editorSubtitle}
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
                const result = editing ? update(editing.id, form) : create(form);
                if (!result.ok) {
                  setFieldErrors((result.errors || {}) as Record<string, string>);
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
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
              placeholder="Announcement title"
            />
            {fieldErrors.title ? <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.title}</div> : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Audience</label>
            <select
              value={form.audience}
              onChange={(e) => setForm((prev) => ({ ...prev, audience: e.target.value as AnnouncementAudience }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            >
              {audiences.map((audience) => (
                <option key={audience.value} value={audience.value}>
                  {audience.label}
                </option>
              ))}
            </select>
            {fieldErrors.audience ? <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.audience}</div> : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Body</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
              className="mt-1 w-full min-h-40 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
              placeholder="Write the announcement..."
            />
            {fieldErrors.body ? <div className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.body}</div> : null}
          </div>
        </div>
      </Modal>

    </>
  );
}
