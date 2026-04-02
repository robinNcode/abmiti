import { apiClient } from './client';
import { Entry, CreateEntryDto, SmsParseResult } from '@/types';

interface ListParams {
  type?: string;
  month?: number;
  year?: number;
  category?: string;
  source?: string;
  page?: number;
  limit?: number;
}

interface ListResponse {
  data: Entry[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const entriesApi = {
  list: (params: ListParams) =>
    apiClient.get<{ data: Entry[]; meta: Record<string, unknown> }>('/entries', { params })
      .then((r) => ({ data: r.data.data, meta: r.data.meta } as ListResponse)),

  getOne: (id: string) =>
    apiClient.get<{ data: Entry }>(`/entries/${id}`).then((r) => r.data.data),

  create: (dto: CreateEntryDto) =>
    apiClient.post<{ data: Entry }>('/entries', dto).then((r) => r.data.data),

  update: (id: string, dto: Partial<CreateEntryDto>) =>
    apiClient.patch<{ data: Entry }>(`/entries/${id}`, dto).then((r) => r.data.data),

  remove: (id: string) =>
    apiClient.delete(`/entries/${id}`),

  parseSms: (sms: string) =>
    apiClient.post<{ data: SmsParseResult }>('/entries/parse-sms', { sms }).then((r) => r.data.data),
};
