// src/services/authService.ts
import api from '../core/network/authInterceptor';
import type { ApiSuccess } from '../models/common';
import type { LoginPayload, RegisterPayload, AuthResponse } from '../types/auth';
import type { User } from '../types/user';

export const authService = {
    async login(payload: LoginPayload): Promise<AuthResponse> {
        const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/login', payload);
        return data.data;
    },

    async register(payload: RegisterPayload): Promise<AuthResponse> {
        const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/register', payload);
        return data.data;
    },

    async getMe(): Promise<User> {
        const { data } = await api.get<ApiSuccess<User>>('/auth/me');
        return data.data;
    },

    async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        const { data } = await api.post<ApiSuccess<{ accessToken: string; refreshToken: string }>>('/auth/refresh', { refreshToken });
        return data.data;
    },
};
