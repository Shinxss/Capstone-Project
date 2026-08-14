import * as Location from "expo-location";

export type DeviceLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
};

const CURRENT_LOCATION_TIMEOUT_MS = 12_000;

async function getCurrentPositionWithTimeout() {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      }),
      new Promise<never>((_resolve, reject) => {
        timeoutHandle = setTimeout(
          () => reject(new Error("Current location request timed out")),
          CURRENT_LOCATION_TIMEOUT_MS
        );
      }),
    ]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

export async function getDeviceLocation(): Promise<DeviceLocation> {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Location permission not granted");
  }

  // Try fresh GPS first
  try {
    const pos = await getCurrentPositionWithTimeout();

    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy ?? undefined,
      timestamp: pos.timestamp,
    };
  } catch {
    // Fallback: last known location (better than failing completely)
    const last = await Location.getLastKnownPositionAsync();
    if (!last) throw new Error("Unable to get location");

    return {
      lat: last.coords.latitude,
      lng: last.coords.longitude,
      accuracy: last.coords.accuracy ?? undefined,
      timestamp: last.timestamp,
    };
  }
}
