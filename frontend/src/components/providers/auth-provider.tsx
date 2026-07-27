"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  authApi,
  clearToken,
  getToken,
  setToken,
  type ApiUser,
} from "@/lib/api";

type AuthContextValue = {
  user: ApiUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: ApiUser | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(profile: ApiUser): ApiUser {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatar: profile.avatar,
    bio: profile.bio,
    authProvider: profile.authProvider || (profile.avatar?.includes("googleusercontent") ? "google" : "local"),
    preferences: profile.preferences,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    const { user: profile } = await authApi.me();
    setUser(toAuthUser(profile));
  }, []);

  const hydrate = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      await refreshUser();
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: nextUser } = await authApi.login({ email, password });
    setToken(token);
    setUser(toAuthUser(nextUser));
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { token, user: nextUser } = await authApi.register({
        name,
        email,
        password,
      });
      setToken(token);
      setUser(toAuthUser(nextUser));
    },
    []
  );

  const googleLogin = useCallback(async (credential: string) => {
    const { token, user: nextUser } = await authApi.google(credential);
    setToken(token);
    try {
      await refreshUser();
    } catch {
      setUser(toAuthUser({ ...nextUser, authProvider: "google" }));
    }
  }, [refreshUser]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, googleLogin, refreshUser, setUser, logout }),
    [user, loading, login, register, googleLogin, refreshUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
