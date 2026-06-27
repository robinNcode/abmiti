import AsyncStorage from '@react-native-async-storage/async-storage';

interface CachedValue<T> {
    cachedAt: number;
    payload: T;
}

export const CacheStorage = {
    async get<T>(key: string, ttlMs: number): Promise<T | null> {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw) as CachedValue<T>;
            if (Date.now() - parsed.cachedAt > ttlMs) return null;
            return parsed.payload;
        } catch {
            return null;
        }
    },

    async set<T>(key: string, payload: T): Promise<void> {
        const value: CachedValue<T> = { cachedAt: Date.now(), payload };
        await AsyncStorage.setItem(key, JSON.stringify(value));
    },
};

