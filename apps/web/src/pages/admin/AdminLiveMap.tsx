import AdminShell from "@/components/admin/AdminShell";
import LguLiveMapView from "@/features/lguLiveMap/components/LguLiveMapView";
import { useLguLiveMap } from "@/features/lguLiveMap/hooks/useLguLiveMap";

export default function AdminLiveMap() {
  const vm = useLguLiveMap();

  return (
    <AdminShell title="Live Map / Dispatch" subtitle="Dispatch volunteers and monitor live incidents">
      <LguLiveMapView {...vm} />
    </AdminShell>
  );
}
