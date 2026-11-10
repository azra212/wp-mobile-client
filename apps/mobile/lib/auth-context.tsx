import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiGet } from "./api";
import { deleteToken, getToken } from "./token";

type User = {
  id: number;
  username: string;
  email: string;
  roles: string[];
};

type LoginResult =
  | { success: true; user: User }
  | { success: false; message: string };

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshMe().finally(() => setLoading(false));

    const interval = setInterval(() => {
      refreshMe().catch(() => {});
    }, 600000);
    return () => clearInterval(interval);
  }, []);

  async function refreshMe() {
    const token = await getToken();
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const me = await apiGet<User>("/bgh/v1/me");
      setUser(me);
    } catch {
      await deleteToken();
      setUser(null);
      throw new Error("Session expired");
    }
  }
  async function login(
    username: string,
    password: string,
  ): Promise<LoginResult> {
    // keep your existing endpoint contract
    const res = await fetch("https://balkangamehub.com/wp-json/bgh/v1/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      return { success: false, message: `Login failed (${res.status})` };
    }

    const data = await res.json();

    if (!data?.success || !data?.token) {
      return {
        success: false,
        message: data?.message ?? "Invalid login response",
      };
    }

    // Save token
    const { saveToken } = await import("./token");
    await saveToken(data.token);

    // Immediately set user (use response if present, otherwise fetch /me)
    if (data.user?.id) {
      setUser(data.user);
      return { success: true, user: data.user as User };
    }

    try {
      await refreshMe();
      const me = await apiGet<User>("/bgh/v1/me");
      return { success: true, user: me };
    } catch {
      return {
        success: false,
        message: "Logged in, but failed to load profile",
      };
    }
  }

  async function logout() {
    await deleteToken();
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshMe }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
