import { getDeviceLocation } from "../../features/emergency/services/locationService";

export type CurrentCoords = {
  latitude: number;
  longitude: number;
};

export async function getCurrentCoords(): Promise<CurrentCoords> {
  try {
    const location = await getDeviceLocation();

    return {
      latitude: location.lat,
      longitude: location.lng,
    };
  } catch (error: any) {
    const message = String(error?.message ?? "").toLowerCase();

    if (message.includes("permission")) {
      throw new Error("Location permission is required to use your current location.");
    }

    throw new Error("Unable to get your current location. Please try again.");
  }
}
