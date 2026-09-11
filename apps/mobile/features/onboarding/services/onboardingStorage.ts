import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../../constants/storageKeys";

const ONBOARDING_COMPLETED_VALUE = "true";

export async function getOnboardingCompleted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
  return value === ONBOARDING_COMPLETED_VALUE;
}

export async function setOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.ONBOARDING_COMPLETED,
    ONBOARDING_COMPLETED_VALUE
  );
}
