import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../../constants/storageKeys";
import type { DispatchOffer } from "../models/dispatch.types";

export async function getActiveDispatch(): Promise<DispatchOffer | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_DISPATCH);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DispatchOffer;
  } catch {
    return null;
  }
}

export async function setActiveDispatch(offer: DispatchOffer | null) {
  if (!offer) {
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_DISPATCH);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_DISPATCH, JSON.stringify(offer));
}
