import { useCallback, useEffect, useState } from 'react';
import type { AuthUser } from '@workspace/api-client-react';

export type { AuthUser };

type TelegramWebApp = {
  initData?: string;
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
};

function getTelegramWebApp(): TelegramWebApp | undefined {
  return (
    globalThis as typeof globalThis & {
      Telegram?: { WebApp?: TelegramWebApp };
    }
  ).Telegram?.WebApp;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

function getBasePath() {
  const baseUrl =
    (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL ??
    '/';
  return baseUrl.replace(/\/+$/, '') || '/';
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const telegram = getTelegramWebApp();
    telegram?.ready?.();
    telegram?.expand?.();
    const headers: Record<string, string> = {};
    if (telegram?.initData) {
      headers['X-Telegram-Init-Data'] = telegram.initData;
    }
    fetch('/api/auth/user', { credentials: 'include', headers })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ user: AuthUser | null }>;
      })
      .then((data) => {
        if (!cancelled) {
          setUser(data.user ?? null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(() => {
    const base = getBasePath();
    window.location.href = `/api/login?returnTo=${encodeURIComponent(base)}`;
  }, []);

  const logout = useCallback(() => {
    const telegram = getTelegramWebApp();
    if (telegram?.initData) {
      telegram.close?.();
      return;
    }
    const base = getBasePath();
    window.location.href = `/api/logout?returnTo=${encodeURIComponent(base)}`;
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
