import { useCallback, useState } from "react";
import { getDeviceLocation } from "../services/locationService";
import { createSosReport } from "../services/emergencyApi";
import { reverseGeocodeCoords } from "../../../shared/services/locationService";
import type { GuestEmergencyContactInput } from "../models/guestEmergencyContact.types";

const REVERSE_GEOCODE_TIMEOUT_MS = 4_000;

async function getOptionalLocationLabel(latitude: number, longitude: number) {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      reverseGeocodeCoords({ latitude, longitude }),
      new Promise<null>((resolve) => {
        timeoutHandle = setTimeout(() => resolve(null), REVERSE_GEOCODE_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

export function useSosReport() {
  const [sending, setSending] = useState(false);

  const sendSos = useCallback(async (guestReporter?: GuestEmergencyContactInput) => {
    setSending(true);
    try {
      const loc = await getDeviceLocation();
      const locationLabel = await getOptionalLocationLabel(loc.lat, loc.lng);

      const report = await createSosReport({
        lat: loc.lat,
        lng: loc.lng,
        accuracy: loc.accuracy,
        ...(locationLabel ? { locationLabel } : {}),
        ...(guestReporter ? { guestReporter } : {}),
      });
      return {
        ...report,
        lat: loc.lat,
        lng: loc.lng,
      };
    } finally {
      setSending(false);
    }
  }, []);

  return { sending, sendSos };
}
