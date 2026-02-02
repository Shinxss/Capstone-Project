const TOKEN_KEY = "__lifeline_token";

export const authStorage = {
  async setToken(token: string) {
    // TODO (later): replace with expo-secure-store
    // await SecureStore.setItemAsync("lifeline_token", token);
    (globalThis as any)[TOKEN_KEY] = token;
  },

  async getToken(): Promise<string | null> {
    return (globalThis as any)[TOKEN_KEY] ?? null;
  },

  async clearToken() {
    (globalThis as any)[TOKEN_KEY] = null;
  },
};
