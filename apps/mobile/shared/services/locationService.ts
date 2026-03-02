import { getDeviceLocation } from "../../features/emergency/services/locationService";
import * as Location from "expo-location";

export type CurrentCoords = {
  latitude: number;
  longitude: number;
};

type AddressParts = Partial<Location.LocationGeocodedAddress>;

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

function composeAddress(parts: AddressParts) {
  const line1 = [parts.name, parts.street, parts.streetNumber]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ");

  const line2 = [parts.district, parts.city, parts.region, parts.postalCode, parts.country]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(", ");

  return [line1, line2].filter(Boolean).join(", ").trim();
}

export async function reverseGeocodeCoords(coords: CurrentCoords): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync(coords);
    if (!results.length) return null;

    const formatted = composeAddress(results[0]);
    return formatted || null;
  } catch {
    return null;
  }
}
