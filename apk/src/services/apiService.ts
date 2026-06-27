import api from '../core/network/authInterceptor';
import type { ApiSuccess } from '../models/common';

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<ApiSuccess<T>> {
    const { data } = await api.get<ApiSuccess<T>>(url, { params });
    return data;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<ApiSuccess<T>> {
    const { data } = await api.post<ApiSuccess<T>>(url, body);
    return data;
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<ApiSuccess<T>> {
    const { data } = await api.patch<ApiSuccess<T>>(url, body);
    return data;
}

export async function apiPut<T>(url: string, body?: unknown): Promise<ApiSuccess<T>> {
    const { data } = await api.put<ApiSuccess<T>>(url, body);
    return data;
}

export async function apiDelete<T>(url: string): Promise<ApiSuccess<T>> {
    const { data } = await api.delete<ApiSuccess<T>>(url);
    return data;
}

