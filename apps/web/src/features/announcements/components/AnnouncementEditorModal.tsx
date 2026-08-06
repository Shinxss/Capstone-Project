import { useState } from "react";
import Modal from "../../../components/ui/Modal";
import type { Announcement, AnnouncementAudience, AnnouncementDraftInput, AnnouncementTemplate } from "../models/announcements.types";
import type { AnnouncementFormErrors, useLguAnnouncements } from "../hooks/useLguAnnouncements";
import { parseAudience } from "../utils/announcementDashboard.utils";

type Props = {
  editing: Announcement | null;
  template: AnnouncementTemplate | null;
  audiences: ReturnType<typeof useLguAnnouncements>["audiences"];
  create: ReturnType<typeof useLguAnnouncements>["create"];
  update: ReturnType<typeof useLguAnnouncements>["update"];
  onClose: () => void;
};

function initialForm(editing: Announcement | null, template: AnnouncementTemplate | null): AnnouncementDraftInput {
  if (editing) return { title: editing.title, body: editing.body, audience: editing.audience };
  if (template) return { title: template.title, body: template.body, audience: template.audience };
  return { title: "", body: "", audience: "LGU" };
}

export default function AnnouncementEditorModal({ editing, template, audiences, create, update, onClose }: Props) {
  const [form, setForm] = useState<AnnouncementDraftInput>(() => initialForm(editing, template));
  const [fieldErrors, setFieldErrors] = useState<AnnouncementFormErrors>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    setFieldErrors({});
    try {
      const result = editing ? await update(editing.id, form) : await create(form);
      if (!result.ok) {
        setFieldErrors(result.errors);
        return;
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title={editing ? "Edit Announcement" : "New Announcement"} subtitle={template && !editing ? `Started from ${template.title}` : editing ? "Update and save changes" : "Create an announcement draft"} onClose={onClose} maxWidthClassName="max-w-3xl" footer={<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-[#24324A] dark:text-slate-200 dark:hover:bg-[#122036]">Cancel</button><button type="button" onClick={() => void save()} disabled={saving} className="h-10 rounded-xl bg-red-600 px-5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">{saving ? "Saving…" : "Save Draft"}</button></div>}>
      <div className="grid gap-4">
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Title<input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Announcement title" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-[#24324A] dark:bg-[#0E1626] dark:text-white" />{fieldErrors.title ? <span className="mt-1 block text-xs text-red-600">{fieldErrors.title}</span> : null}</label>
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Audience<select value={form.audience} onChange={(event) => { const audience = parseAudience(event.target.value); if (audience) setForm((current) => ({ ...current, audience })); }} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-[#24324A] dark:bg-[#0E1626] dark:text-white">{audiences.map((audience: { value: AnnouncementAudience; label: string }) => <option key={audience.value} value={audience.value}>{audience.label}</option>)}</select>{fieldErrors.audience ? <span className="mt-1 block text-xs text-red-600">{fieldErrors.audience}</span> : null}</label>
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Message<textarea value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} placeholder="Write the announcement..." className="mt-2 min-h-44 w-full resize-y rounded-xl border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-[#24324A] dark:bg-[#0E1626] dark:text-white" />{fieldErrors.body ? <span className="mt-1 block text-xs text-red-600">{fieldErrors.body}</span> : null}</label>
      </div>
    </Modal>
  );
}
