import { describe, expect, it, vi } from "vitest";
import {
  ApiError,
  AuthError,
  createApiClient,
  errorMessage,
  parseUser,
  type TokenStore,
} from "./api-client";

const user = {
  id: 7,
  username: "ada",
  email: "ada@example.com",
  roles: ["subscriber"],
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function memoryStore(initial?: { access?: string | null; refresh?: string | null }) {
  const saved = {
    access: initial?.access ?? null,
    refresh: initial?.refresh ?? null,
  };
  const store: TokenStore = {
    getAccessToken: async () => saved.access,
    getRefreshToken: async () => saved.refresh,
    saveTokens: async (access, refresh) => {
      saved.access = access;
      saved.refresh = refresh;
    },
    clearTokens: async () => {
      saved.access = null;
      saved.refresh = null;
    },
  };
  return { saved, store };
}

function clientWith(
  fetchImpl: typeof fetch,
  store = memoryStore().store,
  onAuthFailure = vi.fn(),
  timeoutMs = 15_000,
) {
  return {
    onAuthFailure,
    api: createApiClient({
      baseUrl: "https://example.test/wp-json/",
      store,
      fetchImpl,
      timeoutMs,
      onAuthFailure,
    }),
  };
}

describe("parseUser", () => {
  it("accepts the profile shape the plugin returns", () => {
    expect(parseUser(user)).toEqual(user);
  });

  it("rejects a body that is missing roles", () => {
    expect(parseUser({ id: 1, username: "ada", email: "a@b.c" })).toBeNull();
  });
});

describe("errorMessage", () => {
  it("uses the error text when there is one", () => {
    expect(errorMessage(new ApiError("Invalid credentials.", 401, "invalid_credentials"))).toBe(
      "Invalid credentials.",
    );
  });

  it("falls back for unknown throws", () => {
    expect(errorMessage("nope", "Couldn't load posts.")).toBe("Couldn't load posts.");
  });
});

describe("createApiClient", () => {
  it("stores both tokens after login", async () => {
    const { saved, store } = memoryStore();
    const fetchImpl: typeof fetch = async (url, init) => {
      expect(String(url)).toBe("https://example.test/wp-json/bgh/v1/login");
      expect(init?.body).toBe(JSON.stringify({ username: "ada", password: "secret" }));
      return jsonResponse(200, { ...user, token: "access-1", refresh_token: "refresh-1", user });
    };
    const { api } = clientWith(fetchImpl, store);

    await expect(api.login("ada", "secret")).resolves.toEqual(user);
    expect(saved).toEqual({ access: "access-1", refresh: "refresh-1" });
  });

  it("returns the plugin error and does not keep a session when login is rejected", async () => {
    const { saved, store } = memoryStore();
    const fetchImpl: typeof fetch = async () =>
      jsonResponse(401, { code: "invalid_credentials", message: "Invalid credentials." });
    const { api, onAuthFailure } = clientWith(fetchImpl, store);

    await expect(api.login("ada", "nope")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      code: "invalid_credentials",
      message: "Invalid credentials.",
    });
    expect(saved).toEqual({ access: null, refresh: null });
    expect(onAuthFailure).not.toHaveBeenCalled();
  });

  it("refreshes once after a 401 and retries with the new access token", async () => {
    const { saved, store } = memoryStore({ access: "expired", refresh: "refresh-1" });
    const calls: Array<{ url: string; authorization: string | null }> = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      const headers = new Headers(init?.headers);
      calls.push({ url: String(url), authorization: headers.get("authorization") });
      if (String(url).endsWith("/bgh/v1/refresh")) {
        return jsonResponse(200, { token: "access-2", refresh_token: "refresh-2" });
      }
      if (headers.get("authorization") === "Bearer access-2") {
        return jsonResponse(200, user);
      }
      return jsonResponse(401, { code: "invalid_token", message: "Invalid or expired token." });
    };
    const { api, onAuthFailure } = clientWith(fetchImpl, store);

    await expect(Promise.all([api.me(), api.me()])).resolves.toEqual([user, user]);
    expect(calls.filter((call) => call.url.endsWith("/bgh/v1/refresh"))).toHaveLength(1);
    expect(saved).toEqual({ access: "access-2", refresh: "refresh-2" });
    expect(onAuthFailure).not.toHaveBeenCalled();
  });

  it("clears the session when refresh is rejected", async () => {
    const { saved, store } = memoryStore({ access: "expired", refresh: "refresh-1" });
    const fetchImpl: typeof fetch = async (url) => {
      if (String(url).endsWith("/bgh/v1/refresh")) {
        return jsonResponse(401, { code: "invalid_token", message: "Invalid or expired token." });
      }
      return jsonResponse(401, { code: "invalid_token", message: "Invalid or expired token." });
    };
    const { api, onAuthFailure } = clientWith(fetchImpl, store);

    await expect(api.me()).rejects.toBeInstanceOf(AuthError);
    expect(saved).toEqual({ access: null, refresh: null });
    expect(onAuthFailure).toHaveBeenCalledOnce();
  });

  it("turns an aborted request into a timeout error", async () => {
    const fetchImpl: typeof fetch = (_url, init) =>
      new Promise((_resolve, reject) => {
        const abort = () => {
          const error = new Error("The operation was aborted");
          error.name = "AbortError";
          reject(error);
        };
        if (init?.signal?.aborted) {
          abort();
          return;
        }
        init?.signal?.addEventListener("abort", abort);
      });
    const { api, onAuthFailure } = clientWith(fetchImpl, memoryStore().store, vi.fn(), 30);

    await expect(api.me()).rejects.toMatchObject({ code: "timeout", status: 0 });
    expect(onAuthFailure).not.toHaveBeenCalled();
  });

  it("keeps a non-JSON failure message generic", async () => {
    const fetchImpl: typeof fetch = async () => new Response("nope", { status: 502 });
    const { api } = clientWith(fetchImpl);

    await expect(api.request("/bgh/v1/health", { auth: false })).rejects.toEqual(
      expect.any(ApiError),
    );
    await expect(api.request("/bgh/v1/health", { auth: false })).rejects.toMatchObject({
      status: 502,
      message: "Request failed (502)",
    });
  });
});
