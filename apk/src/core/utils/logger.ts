// src/core/utils/logger.ts
// Simple console logger — swap for a crash reporter (Sentry, etc.) in production.

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
    info: (msg: string, ...args: unknown[]) => {
        if (isDev) console.log(`[INFO] ${msg}`, ...args);
    },
    warn: (msg: string, ...args: unknown[]) => {
        if (isDev) console.warn(`[WARN] ${msg}`, ...args);
    },
    error: (msg: string, ...args: unknown[]) => {
        console.error(`[ERROR] ${msg}`, ...args);
    },
};
