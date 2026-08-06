import LguShell from "../../components/lgu/LguShell";
import LguAnnouncementsView from "../../features/announcements/components/LguAnnouncementsView";
import { useLguAnnouncements } from "../../features/announcements/hooks/useLguAnnouncements";

export default function LguAnnouncements() {
  const vm = useLguAnnouncements();

  return (
    <LguShell title="Announcements" subtitle="Create and manage emergency updates">
      <LguAnnouncementsView {...vm} />
    </LguShell>
  );
}
