import { apiClient } from './client';
import {
  IPayable,
  IPayableWithPayments,
  CreatePayableDto,
  PayPayableDto,
  PatchPayableDto,
  INetPosition,
  Entry,
} from '@/types';

export const payablesApi = {
  list: (status?: string) =>
    apiClient
      .get<{ data: IPayable[] }>('/payables', { params: status ? { status } : {} })
      .then((r) => r.data.data),

  getById: (id: string) =>
    apiClient
      .get<{ data: IPayableWithPayments }>(`/payables/${id}`)
      .then((r) => r.data.data),

  create: (dto: CreatePayableDto) =>
    apiClient
      .post<{ data: IPayable }>('/payables', dto)
      .then((r) => r.data.data),

  patch: (id: string, dto: PatchPayableDto) =>
    apiClient
      .patch<{ data: IPayable }>(`/payables/${id}`, dto)
      .then((r) => r.data.data),

  pay: (id: string, dto: PayPayableDto) =>
    apiClient
      .post<{ data: { payable: IPayable; entry: Entry } }>(`/payables/${id}/payments`, dto)
      .then((r) => r.data.data),

  cancel: (id: string) =>
    apiClient
      .post<{ data: IPayable }>(`/payables/${id}/cancel`)
      .then((r) => r.data.data),

  getNetPosition: () =>
    apiClient
      .get<{ data: INetPosition }>('/summary/net-position')
      .then((r) => r.data.data),
};
