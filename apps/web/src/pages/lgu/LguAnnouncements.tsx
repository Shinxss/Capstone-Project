import LguShell from "../../components/lgu/LguShell";
import LguAnnouncementsView from "../../features/announcements/components/LguAnnouncementsView";
import { useLguAnnouncements } from "../../features/announcements/hooks/useLguAnnouncements";

export default function LguAnnouncements() {
  const vm = useLguAnnouncements();

  return (
    <LguShell title="Announcements" subtitle="Publish updates within LGU scope">
      <LguAnnouncementsView {...vm} loading={vm.loading} error={vm.error} onRefresh={vm.refresh} />
    </LguShell>
  );
}
