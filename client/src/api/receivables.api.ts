import { apiClient } from './client';
import {
  IReceivable,
  IReceivableWithPayments,
  CreateReceivableDto,
  CollectReceivableDto,
  PatchReceivableDto,
} from '@/types';

export const receivablesApi = {
  list: (status?: string) =>
    apiClient
      .get<{ data: IReceivable[] | { data: IReceivable[] } }>('/receivables', {
        params: status ? { status } : {},
      })
      .then((r) => {
        const d = r.data.data;
        if (Array.isArray(d)) return d;
        if (d && Array.isArray((d as { data: IReceivable[] }).data)) {
          return (d as { data: IReceivable[] }).data;
        }
        return [];
      }),

  getById: (id: string) =>
    apiClient
      .get<{ data: IReceivableWithPayments }>(`/receivables/${id}`)
      .then((r) => r.data.data),

  create: (dto: CreateReceivableDto) =>
    apiClient
      .post<{ data: IReceivable }>('/receivables', dto)
      .then((r) => r.data.data),

  patch: (id: string, dto: PatchReceivableDto) =>
    apiClient
      .patch<{ data: IReceivable }>(`/receivables/${id}`, dto)
      .then((r) => r.data.data),

  collect: (id: string, dto: CollectReceivableDto) =>
    apiClient
      .post<{ data: IReceivable }>(`/receivables/${id}/collect`, dto)
      .then((r) => r.data.data),

  cancel: (id: string) =>
    apiClient
      .post<{ data: IReceivable }>(`/receivables/${id}/cancel`)
      .then((r) => r.data.data),

  remove: (id: string) =>
    apiClient
      .delete(`/receivables/${id}`)
      .then((r) => r.data.data),
};
