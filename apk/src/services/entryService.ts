import { apiDelete, apiGet, apiPatch, apiPost } from './apiService';
import type { EntryType, PaginatedMeta, PaymentSource } from '../models/common';
import { mapEntryFromApi, type Entry, type EntryInput, type SmsParseResult } from '../models/entry';

export interface EntryListParams {
    page?: number;
    limit?: number;
    type?: EntryType;
    month?: number;
    year?: number;
    category?: string;
    source?: PaymentSource;
}

export interface EntryListResult {
    data: Entry[];
    meta: PaginatedMeta;
}

function numberMeta(value: unknown, fallback: number): number {
    return typeof value === 'number' ? value : Number(value ?? fallback);
}

export const entryService = {
    async list(params: EntryListParams = {}): Promise<EntryListResult> {
        const response = await apiGet<Record<string, unknown>[]>('/entries', { ...params });
        const meta = response.meta ?? {};
        return {
            data: response.data.map(mapEntryFromApi),
            meta: {
                total: numberMeta(meta.total, response.data.length),
                page: numberMeta(meta.page, params.page ?? 1),
                limit: numberMeta(meta.limit, params.limit ?? 20),
                totalPages: numberMeta(meta.totalPages, 1),
            },
        };
    },

    async create(input: EntryInput): Promise<Entry> {
        const response = await apiPost<Record<string, unknown>>('/entries', input);
        return mapEntryFromApi(response.data);
    },

    async update(id: string, input: Partial<EntryInput>): Promise<Entry> {
        const response = await apiPatch<Record<string, unknown>>(`/entries/${id}`, input);
        return mapEntryFromApi(response.data);
    },

    async remove(id: string): Promise<void> {
        await apiDelete<null>(`/entries/${id}`);
    },

    async parseSms(sms: string): Promise<SmsParseResult> {
        const response = await apiPost<SmsParseResult>('/entries/parse-sms', { sms });
        return response.data;
    },
};
