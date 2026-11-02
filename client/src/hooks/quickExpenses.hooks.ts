import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { quickExpensesApi } from '@/api/quickExpenses.api';
import { useMonthStore } from '@/store/monthStore';
import { QuickExpenseInput } from '@/types';
import { localizedApiError } from '@/utils';

export const quickExpenseKeys = {
  month: (month: number, year: number) => ['quick-expenses', month, year],
  all: ['quick-expenses'] as const,
};

/** Dashboard quick-expense shortcuts for the selected month, with a `logged` flag. */
export const useQuickExpenses = () => {
  const { month, year } = useMonthStore();
  return useQuery({
    queryKey: quickExpenseKeys.month(month, year),
    queryFn: () => quickExpensesApi.list(month, year),
  });
};

export const useReplaceQuickExpenses = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const { month, year } = useMonthStore();
  return useMutation({
    mutationFn: (items: QuickExpenseInput[]) => quickExpensesApi.replace(items, month, year),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: quickExpenseKeys.all });
      toast.success(t('Quick expenses saved'));
    },
    onError: (e: unknown) => toast.error(localizedApiError(e, t, 'Failed to save quick expenses')),
  });
};
