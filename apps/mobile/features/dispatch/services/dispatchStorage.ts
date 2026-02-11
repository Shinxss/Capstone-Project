import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../../constants/storageKeys";
import type { DispatchOffer } from "../models/dispatch";

const KEY = STORAGE_KEYS.ACTIVE_DISPATCH;

export async function getStoredActiveDispatch(): Promise<DispatchOffer | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DispatchOffer;
  } catch {
    return null;
  }
}

export async function setStoredActiveDispatch(offer: DispatchOffer | null) {
  if (!offer) {
    await AsyncStorage.removeItem(KEY);
    return;
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(offer));
}
