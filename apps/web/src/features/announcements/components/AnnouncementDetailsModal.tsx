import { CalendarClock, Users } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import type { Announcement } from "../models/announcements.types";
import { audienceLabel, formatAnnouncementDate } from "../utils/announcementDashboard.utils";
import AnnouncementStatusBadge from "./AnnouncementStatusBadge";

export default function AnnouncementDetailsModal({ announcement, onClose }: { announcement: Announcement; onClose: () => void }) {
  return <Modal open title={announcement.title} subtitle={`Created ${formatAnnouncementDate(announcement.createdAt)}`} onClose={onClose} maxWidthClassName="max-w-2xl"><div className="max-h-[65vh] space-y-4 overflow-y-auto"><div className="flex flex-wrap gap-2"><AnnouncementStatusBadge status={announcement.status} /><span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-[#162238] dark:text-slate-300"><Users size={13} /> {audienceLabel(announcement.audience)}</span></div><p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">{announcement.body || "No announcement content available."}</p><dl className="grid gap-3 border-t border-slate-200 pt-4 text-sm sm:grid-cols-2 dark:border-[#24324A]"><div><dt className="flex items-center gap-1 text-xs font-bold text-slate-500"><CalendarClock size={13} /> Last updated</dt><dd className="mt-1 text-slate-700 dark:text-slate-200">{formatAnnouncementDate(announcement.updatedAt)}</dd></div><div><dt className="flex items-center gap-1 text-xs font-bold text-slate-500"><CalendarClock size={13} /> Published</dt><dd className="mt-1 text-slate-700 dark:text-slate-200">{formatAnnouncementDate(announcement.publishedAt)}</dd></div></dl></div></Modal>;
}
