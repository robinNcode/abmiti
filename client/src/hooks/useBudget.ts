import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { budgetApi } from '@/api/budget.api';
import { useMonthStore } from '@/store/monthStore';
import { BudgetLineInput, IBudgetInput } from '@/types';

export const budgetKeys = {
  month: (month: number, year: number) => ['budget', month, year],
  summary: (id?: string) => ['budget-summary', id],
  templates: ['budget-templates'],
};

export const useBudget = () => {
  const { month, year } = useMonthStore();
  return useQuery({
    queryKey: budgetKeys.month(month, year),
    queryFn: () => budgetApi.getByMonth(month, year),
  });
};

export const useBudgetSummary = (budgetId?: string) =>
  useQuery({
    queryKey: budgetKeys.summary(budgetId),
    queryFn: () => budgetApi.summary(budgetId as string),
    enabled: Boolean(budgetId),
  });

export const useBudgetTemplates = () =>
  useQuery({
    queryKey: budgetKeys.templates,
    queryFn: budgetApi.templates,
  });

export const useBudgetMutations = () => {
  const qc = useQueryClient();
  const { month, year } = useMonthStore();
  const refresh = (budgetId?: string) => {
    qc.invalidateQueries({ queryKey: budgetKeys.month(month, year) });
    qc.invalidateQueries({ queryKey: ['budget-summary'] });
    if (budgetId) qc.invalidateQueries({ queryKey: budgetKeys.summary(budgetId) });
  };

  return {
    updateBudget: useMutation({
      mutationFn: ({ id, dto }: { id: string; dto: Partial<IBudgetInput> }) => budgetApi.update(id, dto),
      onSuccess: (budget) => { refresh(budget._id); toast.success('Budget updated'); },
    }),
    addLine: useMutation({
      mutationFn: ({ id, line }: { id: string; line: BudgetLineInput }) => budgetApi.addLine(id, line),
      onSuccess: (budget) => { refresh(budget._id); toast.success('Budget line saved'); },
    }),
    updateLine: useMutation({
      mutationFn: ({ id, lineId, line }: { id: string; lineId: string; line: Partial<BudgetLineInput> }) => budgetApi.updateLine(id, lineId, line),
      onSuccess: (budget) => { refresh(budget._id); toast.success('Budget line updated'); },
    }),
    removeLine: useMutation({
      mutationFn: ({ id, lineId }: { id: string; lineId: string }) => budgetApi.removeLine(id, lineId),
      onSuccess: (budget) => { refresh(budget._id); toast.success('Budget line removed'); },
    }),
    saveAsTemplate: useMutation({
      mutationFn: ({ id, templateName }: { id: string; templateName: string }) => budgetApi.saveAsTemplate(id, templateName),
      onSuccess: () => { qc.invalidateQueries({ queryKey: budgetKeys.templates }); toast.success('Template saved'); },
    }),
    fromTemplate: useMutation({
      mutationFn: ({ templateId, month: targetMonth, year: targetYear }: { templateId: string; month: number; year: number }) =>
        budgetApi.fromTemplate(templateId, targetMonth, targetYear),
      onSuccess: (budget) => { refresh(budget._id); toast.success('Template applied'); },
    }),
  };
};
