'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import { authApi, usersApi, tokenStorage, LoginResult, MeResult } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser extends MeResult {}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;

  /** Email/password login — returns what step comes next */
  login: (email: string, password: string) => Promise<LoginResult>;

  /** For first-time users: set permanent password */
  firstPassword: (tempToken: string, newPassword: string) => Promise<LoginResult>;

  /** Complete 2FA step after login */
  verify2FA: (userId: string, code: string) => Promise<void>;

  /** Logout current session */
  logout: () => Promise<void>;

  /** Re-fetch current user from /users/me */
  refreshUser: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load user on mount ───────────────────────────────────────────────────
  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (token) {
      loadUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUser = useCallback(async () => {
    try {
      const { data } = await usersApi.getMe();
      setUser(data);
      scheduleRefresh();
    } catch {
      tokenStorage.clear();
      setUser(null);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Schedule token refresh every 12 min (access token = 15 min) ─────────
  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(async () => {
      const refresh = tokenStorage.getRefresh();
      if (!refresh) return;
      try {
        const { data } = await authApi.refresh(refresh);
        tokenStorage.setAccess(data.accessToken);
        tokenStorage.setRefresh(data.refreshToken);
        scheduleRefresh();
      } catch {
        await doLogout();
      }
    }, 12 * 60 * 1000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Store tokens helper ──────────────────────────────────────────────────
  const storeAndLoad = useCallback(
    async (accessToken: string, refreshToken: string) => {
      tokenStorage.setAccess(accessToken);
      tokenStorage.setRefresh(refreshToken);
      await loadUser();
    },
    [loadUser],
  );

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const { data } = await authApi.login(email, password);

      // Full access granted
      if (data.accessToken && data.refreshToken) {
        await storeAndLoad(data.accessToken, data.refreshToken);
        router.push('/dashboard');
      }

      return data;
    },
    [storeAndLoad, router],
  );

  // ─── First Password ───────────────────────────────────────────────────────
  const firstPassword = useCallback(
    async (tempToken: string, newPassword: string): Promise<LoginResult> => {
      const { data } = await authApi.firstPassword(tempToken, newPassword);

      if (data.accessToken && data.refreshToken) {
        await storeAndLoad(data.accessToken, data.refreshToken);
        router.push('/setup-2fa');
      }

      return data;
    },
    [storeAndLoad, router],
  );

  // ─── Verify 2FA ───────────────────────────────────────────────────────────
  const verify2FA = useCallback(
    async (userId: string, code: string) => {
      const { data } = await authApi.verify2FA(userId, code);
      await storeAndLoad(data.accessToken, data.refreshToken);
      router.push('/dashboard');
    },
    [storeAndLoad, router],
  );

  // ─── Logout ───────────────────────────────────────────────────────────────
  const doLogout = useCallback(async () => {
    const refresh = tokenStorage.getRefresh();
    if (refresh) await authApi.logout(refresh).catch(() => {});
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    tokenStorage.clear();
    setUser(null);
    router.push('/login');
  }, [router]);

  const logout = doLogout;

  // ─── Refresh user ─────────────────────────────────────────────────────────
  const refreshUser = useCallback(() => loadUser(), [loadUser]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, firstPassword, verify2FA, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
