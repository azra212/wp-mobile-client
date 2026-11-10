import { createApiClient } from "./api-client";
import { tokenStore } from "./token";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://balkangamehub.com/wp-json";

export const api = createApiClient({
  baseUrl: API_BASE,
  store: tokenStore,
});

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  api.setUnauthorizedHandler(handler);
}

export { ApiError, AuthError, errorMessage } from "./api-client";
export type { User } from "./api-client";
