import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../../constants/storageKeys";

const GUEST_SOS_USED_VALUE = "1";

export async function readGuestSosUsed(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.GUEST_SOS_USED);
    return raw === GUEST_SOS_USED_VALUE;
  } catch {
    return false;
  }
}

export async function markGuestSosUsed(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.GUEST_SOS_USED, GUEST_SOS_USED_VALUE);
}
