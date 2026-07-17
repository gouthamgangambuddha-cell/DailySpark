import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import toast from "react-hot-toast";
import type { PublicUser } from "@dailyspark/types";
import { authApi } from "./api/authApi";
import { setAccessToken } from "@/lib/apiClient";

interface AuthContextValue {
  user: PublicUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateLocalUser: (user: PublicUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load, attempt a silent refresh using the httpOnly cookie so
  // returning users don't have to log in again every page load.
  useEffect(() => {
    (async () => {
      try {
        const { user: refreshedUser, accessToken } = await authApi.refresh();
        setAccessToken(accessToken);
        setUser(refreshedUser);
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedInUser, accessToken } = await authApi.login({ email, password });
    setAccessToken(accessToken);
    setUser(loggedInUser);
  }, []);

  const googleLogin = useCallback(async (idToken: string) => {
    const { user: loggedInUser, accessToken } = await authApi.googleLogin(idToken);
    setAccessToken(accessToken);
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { user: registeredUser, accessToken } = await authApi.register({
      name,
      email,
      password,
    });
    setAccessToken(accessToken);
    setUser(registeredUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
      toast.success("Logged out");
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const freshUser = await authApi.me();
    setUser(freshUser);
  }, []);

  const updateLocalUser = useCallback((updatedUser: PublicUser) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, googleLogin, register, logout, refreshUser, updateLocalUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
