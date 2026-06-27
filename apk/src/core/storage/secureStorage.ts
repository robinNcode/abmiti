// src/core/storage/secureStorage.ts
// Wraps expo-secure-store for KeyChain-equivalent secure token storage.
// NEVER use AsyncStorage for JWTs.

import * as SecureStore from 'expo-secure-store';

const KEYS = {
    ACCESS_TOKEN: 'abmiti_access_token',
    REFRESH_TOKEN: 'abmiti_refresh_token',
    USER: 'abmiti_user',
} as const;

export const SecureStorage = {
    async setTokens(access: string, refresh: string): Promise<void> {
        await Promise.all([
            SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, access),
            SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refresh),
        ]);
    },

    async getAccessToken(): Promise<string | null> {
        return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
    },

    async getRefreshToken(): Promise<string | null> {
        return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
    },

    async setUser(user: object): Promise<void> {
        await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
    },

    async getUser<T>(): Promise<T | null> {
        const raw = await SecureStore.getItemAsync(KEYS.USER);
        if (!raw) return null;
        try { return JSON.parse(raw) as T; } catch { return null; }
    },

    async clearAll(): Promise<void> {
        await Promise.all([
            SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
            SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
            SecureStore.deleteItemAsync(KEYS.USER),
        ]);
    },
};
