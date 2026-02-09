import LguShell from "../../components/lgu/LguShell";

import LguLiveMapView from "../../features/lguLiveMap/components/LguLiveMapView";
import { useLguLiveMap } from "../../features/lguLiveMap/hooks/useLguLiveMap";

export default function LguLiveMap() {
  const vm = useLguLiveMap();

  return (
    <LguShell title="Live Map" subtitle="">
      <LguLiveMapView {...vm} />
    </LguShell>
  );
}
