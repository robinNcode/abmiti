import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setUser: (user) =>
        set({ user }),

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'abmiti-auth',
      partialize: (s) => ({
        accessToken:  s.accessToken,
        refreshToken: s.refreshToken,
      }),
      // The user record is derived from the access token via /auth/me. Keeping
      // it out of storage prevents an old user's role/profile being paired with
      // a newly stored token after another person signs in in this browser.
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<AuthState>),
        user: null,
      }),
    },
  ),
);
