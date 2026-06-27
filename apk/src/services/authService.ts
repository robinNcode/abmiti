// src/services/authService.ts
import api from '../core/network/authInterceptor';
import type { LoginPayload, RegisterPayload, AuthResponse } from '../types/auth';
import type { User } from '../types/user';

export const authService = {
    async login(payload: LoginPayload): Promise<AuthResponse> {
        const { data } = await api.post<AuthResponse>('/auth/login', payload);
        return data;
    },

    async register(payload: RegisterPayload): Promise<AuthResponse> {
        const { data } = await api.post<AuthResponse>('/auth/register', payload);
        return data;
    },

    async getMe(): Promise<User> {
        const { data } = await api.get<{ data: User }>('/auth/me');
        return data.data;
    },

    async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        const { data } = await api.post('/auth/refresh', { refreshToken });
        return data;
    },
};
