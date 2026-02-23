import AdminShell from "@/components/admin/AdminShell";
import AdminAnnouncementsView from "@/features/adminAnnouncements/components/AdminAnnouncementsView";
import { useAdminAnnouncements } from "@/features/adminAnnouncements/hooks/useAdminAnnouncements";

export default function AdminAnnouncements() {
  const vm = useAdminAnnouncements();

  return (
    <AdminShell title="Announcements" subtitle="Create, publish, and manage announcement feeds">
      <AdminAnnouncementsView {...vm} />
    </AdminShell>
  );
}
