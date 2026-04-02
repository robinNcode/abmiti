import { apiClient } from './client';
import { User } from '@/types';

interface AuthResponse { user: User; accessToken: string; refreshToken: string; }

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    apiClient.post<{ data: AuthResponse }>('/auth/register', data).then((r) => r.data.data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<{ data: AuthResponse }>('/auth/login', data).then((r) => r.data.data),

  me: () =>
    apiClient.get<{ data: User }>('/auth/me').then((r) => r.data.data),
};
