import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { IBudgetInput, IBudget } from '../types';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { localizedApiError } from '../utils';

export const useBudgets = () => {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: IBudget[] }>('/budgets/list/all');
      return res.data.data;
    },
  });
};

export const useMonthlyBudget = (month: number, year: number) => {
  return useQuery({
    queryKey: ['budget', month, year],
    queryFn: async () => {
      const res = await apiClient.get<{ data: IBudget | null }>(`/budgets?month=${month}&year=${year}`);
      return res.data.data;
    },
  });
};

export const useUpsertBudget = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async (data: IBudgetInput) => {
      await apiClient.post('/budgets', data);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      qc.invalidateQueries({ queryKey: ['budget', variables.month, variables.year] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (error: unknown) => toast.error(localizedApiError(error, t, 'Failed to save budget')),
  });
};

export const useDeleteBudget = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/budgets/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      qc.invalidateQueries({ queryKey: ['budget'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (error: unknown) => toast.error(localizedApiError(error, t, 'Failed to delete budget')),
  });
};
