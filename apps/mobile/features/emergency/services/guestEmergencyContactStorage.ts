import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../../constants/storageKeys";
import type { GuestEmergencyContact } from "../models/guestEmergencyContact.types";
import {
  normalizeGuestFullName,
  normalizePhilippineMobileNumber,
} from "../utils/guestEmergencyContactValidators";

export async function readGuestEmergencyContact(): Promise<GuestEmergencyContact | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.GUEST_EMERGENCY_CONTACT);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GuestEmergencyContact>;
    const fullName = normalizeGuestFullName(String(parsed.fullName ?? ""));
    const phoneNumber = normalizePhilippineMobileNumber(String(parsed.phoneNumber ?? ""));
    if (fullName.length < 2 || fullName.length > 80 || !phoneNumber) return null;

    return {
      fullName,
      phoneNumber,
      updatedAt:
        typeof parsed.updatedAt === "string" && parsed.updatedAt.trim()
          ? parsed.updatedAt
          : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

export async function saveGuestEmergencyContact(
  contact: GuestEmergencyContact
): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.GUEST_EMERGENCY_CONTACT,
    JSON.stringify(contact)
  );
}
