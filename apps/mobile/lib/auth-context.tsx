import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, errorMessage, setUnauthorizedHandler, type User } from "./api";

type LoginResult = { success: true; user: User } | { success: false; message: string };

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const signedIn = await api.hasSession();
    if (!signedIn) {
      setUser(null);
      return;
    }

    try {
      setUser(await api.me());
    } catch (error) {
      setUser(null);
      throw error;
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });

    refreshMe()
      .catch(() => {
        // A failed restore leaves the user on the login screen.
      })
      .finally(() => setLoading(false));

    return () => setUnauthorizedHandler(null);
  }, [refreshMe]);

  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    try {
      const next = await api.login(username, password);
      setUser(next);
      return { success: true, user: next };
    } catch (error) {
      return { success: false, message: errorMessage(error, "Login failed") };
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshMe }),
    [user, loading, login, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
