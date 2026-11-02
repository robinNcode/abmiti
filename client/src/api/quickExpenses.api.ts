import { apiClient } from './client';
import { QuickExpenseItem, QuickExpenseInput } from '@/types';

export const quickExpensesApi = {
  list: (month?: number, year?: number) =>
    apiClient
      .get<{ data: QuickExpenseItem[] }>('/quick-expenses', { params: { month, year } })
      .then((r) => r.data.data),

  replace: (items: QuickExpenseInput[], month?: number, year?: number) =>
    apiClient
      .put<{ data: QuickExpenseItem[] }>('/quick-expenses', { items, month, year })
      .then((r) => r.data.data),
};
