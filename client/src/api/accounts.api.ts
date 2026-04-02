import { apiClient } from './client';
import { Account } from '@/types';

export const accountsApi = {
  list: () =>
    apiClient.get<{ data: Account[] }>('/accounts')
      .then((r) => r.data.data),

  create: (dto: {
    name: string;
    type: 'bank' | 'mobile';
    accountNumber?: string;
    bankName?: string;
    provider?: 'bkash' | 'nagad' | 'rocket';
    balance: number;
    isActive: boolean;
  }) =>
    apiClient.post<{ data: Account }>('/accounts', dto).then((r) => r.data.data),

  update: (id: string, dto: Partial<{
    name: string;
    type: 'bank' | 'mobile';
    accountNumber?: string;
    bankName?: string;
    provider?: 'bkash' | 'nagad' | 'rocket';
    balance: number;
    isActive: boolean;
  }>) =>
    apiClient.put<{ data: Account }>(`/accounts/${id}`, dto).then((r) => r.data.data),

  remove: (id: string) =>
    apiClient.delete(`/accounts/${id}`),
};
