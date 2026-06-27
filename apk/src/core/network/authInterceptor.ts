// src/core/network/authInterceptor.ts
// Attaches Bearer token to every request.
// On 401, attempts a silent token refresh and retries once.
// On refresh failure, triggers logout.

import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import api from './apiClient';
import { SecureStorage } from '../storage/secureStorage';
import { logger } from '../utils/logger';

interface QueueItem {
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null = null) {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token!);
    });
    failedQueue = [];
}

// Called by the auth store on logout — must be set before interceptor fires
let logoutCallback: (() => void) | null = null;
export function setLogoutCallback(cb: () => void) {
    logoutCallback = cb;
}

// ── Request Interceptor ────────────────────────────────────────────────────────
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await SecureStorage.getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// ── Response Interceptor ───────────────────────────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            // Queue the request until token refresh completes
            return new Promise<string>((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return api(originalRequest);
                })
                .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const refreshToken = await SecureStorage.getRefreshToken();
            if (!refreshToken) throw new Error('No refresh token available');

            // Call the refresh endpoint directly (no interceptor interference)
            const { data } = await axios.post<{ data: { accessToken: string; refreshToken?: string } }>(
                `${api.defaults.baseURL}/auth/refresh`,
                { refreshToken },
            );

            const newAccess = data.data.accessToken;
            const newRefresh = data.data.refreshToken ?? refreshToken;

            await SecureStorage.setTokens(newAccess, newRefresh);
            processQueue(null, newAccess);

            if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            }
            return api(originalRequest);
        } catch (refreshError) {
            logger.error('Token refresh failed', refreshError);
            processQueue(refreshError);
            logoutCallback?.();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    },
);

export default api;
