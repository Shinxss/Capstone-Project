import * as Location from "expo-location";

export type DeviceLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
};

export async function getDeviceLocation(): Promise<DeviceLocation> {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Location permission not granted");
  }

  // Try fresh GPS first
  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });

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
