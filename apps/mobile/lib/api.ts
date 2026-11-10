import { deleteToken, getToken } from "./token";

const API_BASE = "https://balkangamehub.com/wp-json";

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (res.status === 401) {
    await deleteToken();
    throw new AuthError("Session expired");
  }

  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }

  return res.json();
}
