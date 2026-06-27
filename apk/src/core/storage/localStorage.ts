// src/core/storage/localStorage.ts
// Async Storage for non-sensitive, non-JWT data: preferences, theme, cached config.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    THEME: 'abmiti_theme',
    LAST_ROUTE: 'abmiti_last_route',
    APP_CONFIG: 'abmiti_app_config',
} as const;

export const LocalStorage = {
    async getTheme(): Promise<string | null> {
        return AsyncStorage.getItem(KEYS.THEME);
    },

    async setTheme(theme: string): Promise<void> {
        await AsyncStorage.setItem(KEYS.THEME, theme);
    },

    async getLastRoute(): Promise<string | null> {
        return AsyncStorage.getItem(KEYS.LAST_ROUTE);
    },

    async setLastRoute(route: string): Promise<void> {
        await AsyncStorage.setItem(KEYS.LAST_ROUTE, route);
    },

    async setAppConfig(config: object): Promise<void> {
        await AsyncStorage.setItem(KEYS.APP_CONFIG, JSON.stringify(config));
    },

    async getAppConfig<T>(): Promise<T | null> {
        const raw = await AsyncStorage.getItem(KEYS.APP_CONFIG);
        if (!raw) return null;
        try { return JSON.parse(raw) as T; } catch { return null; }
    },

    async clearAll(): Promise<void> {
        await Promise.all(Object.values(KEYS).map(key => AsyncStorage.removeItem(key)));
    },
};
