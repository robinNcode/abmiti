import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { IBudgetInput, IBudget } from '../types';

export const useBudgets = () => {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: IBudget[] }>('/budgets');
      return res.data.data;
    },
  });
};

export const useMonthlyBudget = (month: number, year: number) => {
  return useQuery({
    queryKey: ['budget', month, year],
    queryFn: async () => {
      const res = await apiClient.get<{ data: IBudget | null }>(`/budgets/monthly?month=${month}&year=${year}`);
      return res.data.data;
    },
  });
};

export const useUpsertBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: IBudgetInput) => {
      await apiClient.post('/budgets', data);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      qc.invalidateQueries({ queryKey: ['budget', variables.month, variables.year] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    },
  });
};

export const useDeleteBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/budgets/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      qc.invalidateQueries({ queryKey: ['budget'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    },
  });
};
