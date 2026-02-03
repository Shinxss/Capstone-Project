import { useCallback, useState } from "react";
import { getDeviceLocation } from "../services/locationService";
import { createSosReport } from "../services/emergencyApi";

export function useSosReport() {
  const [sending, setSending] = useState(false);

  const sendSos = useCallback(async () => {
    setSending(true);
    try {
      const loc = await getDeviceLocation();
      const report = await createSosReport({
        lat: loc.lat,
        lng: loc.lng,
        accuracy: loc.accuracy,
      });
      return report;
    } finally {
      setSending(false);
    }
  }, []);

  return { sending, sendSos };
}
