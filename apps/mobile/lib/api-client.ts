export type User = {
  id: number;
  username: string;
  email: string;
  roles: string[];
};

export type TokenStore = {
  getAccessToken: () => Promise<string | null>;
  getRefreshToken: () => Promise<string | null>;
  saveTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  clearTokens: () => Promise<void>;
};

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** Send the access token. Defaults to true. */
  auth?: boolean;
  timeoutMs?: number;
  /** Internal. A retried request must not refresh again. */
  retry?: boolean;
};

type TokenPair = {
  token: string;
  refreshToken: string;
};

const DEFAULT_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = "http_error") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export class AuthError extends ApiError {
  constructor(message = "Session expired") {
    super(message, 401, "unauthorized");
    this.name = "AuthError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseUser(value: unknown): User | null {
  if (!isRecord(value)) {
    return null;
  }

  const { id, username, email, roles } = value;
  if (typeof id !== "number" || !Number.isInteger(id)) {
    return null;
  }
  if (typeof username !== "string" || username.length === 0) {
    return null;
  }
  if (typeof email !== "string") {
    return null;
  }
  if (!Array.isArray(roles) || roles.some((role) => typeof role !== "string")) {
    return null;
  }

  return { id, username, email, roles };
}

export function errorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

function parseTokenPair(value: unknown): TokenPair | null {
  if (!isRecord(value)) {
    return null;
  }

  const { token, refresh_token: refreshToken } = value;
  if (typeof token !== "string" || token.length === 0) {
    return null;
  }
  if (typeof refreshToken !== "string" || refreshToken.length === 0) {
    return null;
  }

  return { token, refreshToken };
}

function joinUrl(baseUrl: string, path: string): string {
  const root = baseUrl.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${root}${suffix}`;
}

function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === "AbortError";
}

async function errorFromResponse(response: Response): Promise<ApiError> {
  let code = "http_error";
  let message = `Request failed (${response.status})`;

  try {
    const body: unknown = await response.json();
    if (isRecord(body)) {
      if (typeof body.code === "string" && body.code.length > 0) {
        code = body.code;
      }
      if (typeof body.message === "string" && body.message.length > 0) {
        message = body.message;
      }
    }
  } catch {
    // A non-JSON body keeps the status fallback.
  }

  return new ApiError(message, response.status, code);
}

export type ApiClient = {
  request<T>(path: string, options?: RequestOptions): Promise<T>;
  login(username: string, password: string): Promise<User>;
  me(): Promise<User>;
  logout(): Promise<void>;
  hasSession(): Promise<boolean>;
  setUnauthorizedHandler(handler: (() => void) | null): void;
};

export function createApiClient(options: {
  baseUrl: string;
  store: TokenStore;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  onAuthFailure?: () => void;
}): ApiClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let onAuthFailure = options.onAuthFailure ?? null;
  let refreshInFlight: Promise<boolean> | null = null;

  async function request<T>(path: string, requestOptions: RequestOptions = {}): Promise<T> {
    const method = requestOptions.method ?? "GET";
    const auth = requestOptions.auth !== false;
    const timeout = requestOptions.timeoutMs ?? timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (requestOptions.body !== undefined) {
        headers["Content-Type"] = "application/json";
      }
      if (auth) {
        const token = await options.store.getAccessToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }

      const response = await fetchImpl(joinUrl(options.baseUrl, path), {
        method,
        headers,
        body:
          requestOptions.body !== undefined ? JSON.stringify(requestOptions.body) : undefined,
        signal: controller.signal,
      });

      if (response.status === 401 && auth) {
        if (requestOptions.retry !== false) {
          const refreshed = await refreshAfterUnauthorized();
          if (refreshed) {
            return request<T>(path, { ...requestOptions, retry: false });
          }
        }

        await options.store.clearTokens();
        onAuthFailure?.();
        throw new AuthError();
      }

      if (!response.ok) {
        throw await errorFromResponse(response);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const text = await response.text();
      if (text.length === 0) {
        return undefined as T;
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        throw new ApiError("Response was not JSON", response.status, "invalid_json");
      }
    } catch (error) {
      if (isAbortError(error)) {
        throw new ApiError("Request timed out", 0, "timeout");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async function refreshAfterUnauthorized(): Promise<boolean> {
    if (!refreshInFlight) {
      refreshInFlight = performRefresh().finally(() => {
        refreshInFlight = null;
      });
    }

    try {
      return await refreshInFlight;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return false;
      }
      throw error;
    }
  }

  async function performRefresh(): Promise<boolean> {
    const refreshToken = await options.store.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    const body = await request<unknown>("/bgh/v1/refresh", {
      method: "POST",
      auth: false,
      retry: false,
      body: { refresh_token: refreshToken },
    });
    const tokens = parseTokenPair(body);
    if (!tokens) {
      return false;
    }

    await options.store.saveTokens(tokens.token, tokens.refreshToken);
    return true;
  }

  return {
    request,
    async login(username, password) {
      const body = await request<unknown>("/bgh/v1/login", {
        method: "POST",
        auth: false,
        body: { username, password },
      });
      if (!isRecord(body)) {
        throw new ApiError("Invalid login response", 200, "invalid_response");
      }

      const user = parseUser(body.user);
      const tokens = parseTokenPair(body);
      if (!user || !tokens) {
        throw new ApiError("Invalid login response", 200, "invalid_response");
      }

      await options.store.saveTokens(tokens.token, tokens.refreshToken);
      return user;
    },
    async me() {
      const body = await request<unknown>("/bgh/v1/me");
      const user = parseUser(body);
      if (!user) {
        throw new ApiError("Invalid profile response", 200, "invalid_response");
      }
      return user;
    },
    async logout() {
      await options.store.clearTokens();
    },
    async hasSession() {
      const access = await options.store.getAccessToken();
      if (access) {
        return true;
      }
      const refresh = await options.store.getRefreshToken();
      return refresh !== null && refresh.length > 0;
    },
    setUnauthorizedHandler(handler) {
      onAuthFailure = handler;
    },
  };
}
