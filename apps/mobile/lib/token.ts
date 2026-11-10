import * as SecureStore from "expo-secure-store";
import type { TokenStore } from "./api-client";

const ACCESS_KEY = "bgh_jwt";
const REFRESH_KEY = "bgh_jwt_refresh";

async function remove(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // deleteItemAsync rejects when the key is already gone.
  }
}

export const tokenStore: TokenStore = {
  getAccessToken() {
    return SecureStore.getItemAsync(ACCESS_KEY);
  },
  getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  async saveTokens(accessToken, refreshToken) {
    await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  },
  async clearTokens() {
    await remove(ACCESS_KEY);
    await remove(REFRESH_KEY);
  },
};
