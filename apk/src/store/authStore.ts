// src/store/authStore.ts
import { create } from 'zustand';
import { authService } from '../services/authService';
import { SecureStorage } from '../core/storage/secureStorage';
import { setLogoutCallback } from '../core/network/authInterceptor';
import { logger } from '../core/utils/logger';
import type { User } from '../types/user';
import type { LoginPayload, RegisterPayload } from '../types/auth';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    hydrate: () => Promise<void>;
    login: (payload: LoginPayload) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
    // Wire the logout callback so the interceptor can trigger it on refresh failure
    setLogoutCallback(() => get().logout());

    return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        /** Called on app start — reads persisted tokens and validates them */
        hydrate: async () => {
            set({ isLoading: true, error: null });
            try {
                const token = await SecureStorage.getAccessToken();
                if (!token) {
                    set({ isLoading: false });
                    return;
                }
                // Try to get the current user to confirm token is still valid
                const user = await authService.getMe();
                await SecureStorage.setUser(user);
                set({ user, isAuthenticated: true });
            } catch (err) {
                logger.warn('Hydrate failed — attempting refresh');
                try {
                    await get().refreshToken();
                } catch {
                    await SecureStorage.clearAll();
                    set({ user: null, isAuthenticated: false });
                }
            } finally {
                set({ isLoading: false });
            }
        },

        login: async (payload) => {
            set({ isLoading: true, error: null });
            try {
                const { accessToken, refreshToken, user } = await authService.login(payload);
                await SecureStorage.setTokens(accessToken, refreshToken);
                await SecureStorage.setUser(user);
                set({ user, isAuthenticated: true });
            } catch (err: unknown) {
                const msg = extractErrorMessage(err, 'Invalid email or password.');
                set({ error: msg });
                throw err;
            } finally {
                set({ isLoading: false });
            }
        },

        register: async (payload) => {
            set({ isLoading: true, error: null });
            try {
                await authService.register(payload);
                // Don't auto-login after register; redirect to login screen instead
            } catch (err: unknown) {
                const msg = extractErrorMessage(err, 'Registration failed. Please try again.');
                set({ error: msg });
                throw err;
            } finally {
                set({ isLoading: false });
            }
        },

        logout: async () => {
            set({ isLoading: true });
            try {
                await SecureStorage.clearAll();
            } catch {
                // Ignore errors — clear local state regardless
            } finally {
                set({ user: null, isAuthenticated: false, isLoading: false, error: null });
            }
        },

        refreshToken: async () => {
            const refreshToken = await SecureStorage.getRefreshToken();
            if (!refreshToken) throw new Error('No refresh token');
            const tokens = await authService.refreshToken(refreshToken);
            await SecureStorage.setTokens(tokens.accessToken, tokens.refreshToken);
            const user = await authService.getMe();
            await SecureStorage.setUser(user);
            set({ user, isAuthenticated: true });
        },

        clearError: () => set({ error: null }),
    };
});

function extractErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        return response?.data?.message ?? fallback;
    }
    if (err instanceof Error) return err.message;
    return fallback;
}
