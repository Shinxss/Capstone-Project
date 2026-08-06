import { useState } from "react";
import { useConfirm } from "@/features/feedback/hooks/useConfirm";
import type { Announcement, AnnouncementTemplate } from "../models/announcements.types";
import { useLguAnnouncements } from "../hooks/useLguAnnouncements";
import AnnouncementCard from "./AnnouncementCard";
import AnnouncementDetailsModal from "./AnnouncementDetailsModal";
import AnnouncementEditorModal from "./AnnouncementEditorModal";
import { AnnouncementErrorState, AnnouncementSkeleton, AnnouncementsEmptyState } from "./AnnouncementStates";
import AnnouncementStats from "./AnnouncementStats";
import AnnouncementToolbar from "./AnnouncementToolbar";
import AnnouncementsHeader from "./AnnouncementsHeader";
import SuggestedTemplatesPanel from "./SuggestedTemplatesPanel";

type Props = ReturnType<typeof useLguAnnouncements>;
type EditorRequest = { editing: Announcement | null; template: AnnouncementTemplate | null };

export default function LguAnnouncementsView(props: Props) {
  const confirm = useConfirm();
  const [editor, setEditor] = useState<EditorRequest | null>(null);
  const [details, setDetails] = useState<Announcement | null>(null);
  const [templatesExpanded, setTemplatesExpanded] = useState(false);

  const requestDelete = async (announcement: Announcement) => {
    const confirmed = await confirm({ title: "Delete announcement?", description: `This will remove “${announcement.title}” from your announcement records.`, confirmText: "Delete", cancelText: "Cancel", variant: "destructive" });
    if (confirmed) await props.remove(announcement.id);
  };

  const requestUnpublish = async (announcement: Announcement) => {
    const confirmed = await confirm({ title: "Unpublish announcement?", description: `“${announcement.title}” will return to drafts and no longer be visible in the published feed.`, confirmText: "Unpublish", cancelText: "Cancel", variant: "default" });
    if (confirmed) await props.unpublish(announcement.id);
  };

  const browseTemplates = () => {
    setTemplatesExpanded(true);
    document.getElementById("announcement-templates")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <div className="mx-auto w-full max-w-[1680px] space-y-5 px-4 py-5 sm:px-6 sm:py-6"><AnnouncementsHeader onCreate={() => setEditor({ editing: null, template: null })} />{props.loading ? <AnnouncementSkeleton /> : <><AnnouncementStats statistics={props.statistics} /><AnnouncementToolbar filters={props.filters} onChange={props.updateFilter} /><div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.9fr)]"><main aria-label="Announcements" className="space-y-3">{props.error ? <AnnouncementErrorState onRetry={props.refresh} /> : props.announcements.length === 0 ? <AnnouncementsEmptyState filtered={props.filtersActive || props.allAnnouncements.length > 0} onCreate={() => setEditor({ editing: null, template: null })} onBrowse={browseTemplates} onClear={props.clearFilters} /> : props.announcements.map((announcement) => <AnnouncementCard key={announcement.id} announcement={announcement} busy={props.busyId === announcement.id} onView={setDetails} onEdit={(item) => setEditor({ editing: item, template: null })} onPublish={(item) => void props.publish(item.id)} onUnpublish={(item) => void requestUnpublish(item)} onDelete={(item) => void requestDelete(item)} />)}</main><SuggestedTemplatesPanel key={templatesExpanded ? "all" : "suggested"} revealAll={templatesExpanded} onUse={(template) => setEditor({ editing: null, template })} /></div></>}{editor ? <AnnouncementEditorModal editing={editor.editing} template={editor.template} audiences={props.audiences} create={props.create} update={props.update} onClose={() => setEditor(null)} /> : null}{details ? <AnnouncementDetailsModal announcement={details} onClose={() => setDetails(null)} /> : null}</div>;
}
