import { useCallback, useState } from "react";
import { getDeviceLocation } from "../services/locationService";
import { createSosReport } from "../services/emergencyApi";
import { reverseGeocodeCoords } from "../../../shared/services/locationService";

export function useSosReport() {
  const [sending, setSending] = useState(false);

  const sendSos = useCallback(async () => {
    setSending(true);
    try {
      const loc = await getDeviceLocation();
      const locationLabel = await reverseGeocodeCoords({
        latitude: loc.lat,
        longitude: loc.lng,
      });

      const report = await createSosReport({
        lat: loc.lat,
        lng: loc.lng,
        accuracy: loc.accuracy,
        ...(locationLabel ? { locationLabel } : {}),
      });
      return report;
    } finally {
      setSending(false);
    }
  }, []);

  return { sending, sendSos };
}
