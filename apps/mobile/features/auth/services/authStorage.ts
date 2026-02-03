import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "__lifeline_token";

export const authStorage = {
  async setToken(token: string) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },

  async clearToken() {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },
};
