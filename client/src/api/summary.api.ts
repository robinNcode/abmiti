import { apiClient } from './client';
import { Category, EntryType, MonthlySummary, CategoryBreakdown, MonthlyTrend, YearlySummary, AccountSummary } from '@/types';

export const categoriesApi = {
  list: (type?: EntryType) =>
    apiClient.get<{ data: Category[] }>('/categories', { params: type ? { type } : {} })
      .then((r) => r.data.data),

  create: (dto: { name: string; icon?: string; color?: string; type: EntryType }) =>
    apiClient.post<{ data: Category }>('/categories', dto).then((r) => r.data.data),

  update: (id: string, dto: Partial<{ name: string; icon: string; color: string }>) =>
    apiClient.patch<{ data: Category }>(`/categories/${id}`, dto).then((r) => r.data.data),

  remove: (id: string) =>
    apiClient.delete(`/categories/${id}`),
};

export const summaryApi = {
  monthly: (month: number, year: number) =>
    apiClient.get<{ data: MonthlySummary }>('/summary/monthly', { params: { month, year } })
      .then((r) => r.data.data),

  categories: (month: number, year: number) =>
    apiClient.get<{ data: CategoryBreakdown[] }>('/summary/categories', { params: { month, year } })
      .then((r) => r.data.data),

  yearly: (year: number) =>
    apiClient.get<{ data: MonthlyTrend[] }>('/summary/yearly', { params: { year } })
      .then((r) => r.data.data),

  yearlySummary: (year: number) =>
    apiClient.get<{ data: YearlySummary }>('/summary/yearly-summary', { params: { year } })
      .then((r) => r.data.data),

  accounts: (year?: number) =>
    apiClient.get<{ data: AccountSummary[] }>('/summary/accounts', { params: year ? { year } : {} })
      .then((r) => r.data.data),
};
