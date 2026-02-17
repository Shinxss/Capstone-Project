import * as SecureStore from "expo-secure-store";

export async function setSecure(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function getSecure(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function removeSecure(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}
