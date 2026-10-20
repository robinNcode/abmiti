import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { entriesApi } from '@/api/entries.api';
import { categoriesApi, summaryApi } from '@/api/summary.api';
import { accountsApi } from '@/api/accounts.api';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import { useMonthStore } from '@/store/monthStore';
import { CreateEntryDto, EntryType } from '@/types';
import { localizedApiError } from '@/utils';

// ── Query keys ───────────────────────────────────────────────
export const QK = {
  entries:    (params: object) => ['entries', params],
  summary:    (m: number, y: number) => ['summary', m, y],
  categories: (m: number, y: number) => ['categories-breakdown', m, y],
  yearly:     (y: number) => ['yearly', y],
  cats:       (type?: EntryType) => ['cats', type],
};

// ── Entries ──────────────────────────────────────────────────
export const useEntries = (params: Parameters<typeof entriesApi.list>[0]) =>
  useQuery({
    queryKey: QK.entries(params),
    queryFn:  () => entriesApi.list(params),
  });

export const useCreateEntry = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (dto: CreateEntryDto) => entriesApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entries'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
      qc.invalidateQueries({ queryKey: ['categories-breakdown'] });
      qc.invalidateQueries({ queryKey: ['yearly'] });
      toast.success(t('Entry saved ✓'));
    },
    onError: (e: unknown) => toast.error(localizedApiError(e, t, 'Failed to save entry')),
  });
};

export const useDeleteEntry = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => entriesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entries'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
      qc.invalidateQueries({ queryKey: ['categories-breakdown'] });
      toast.success(t('Entry deleted'));
    },
    onError: (e: unknown) => toast.error(localizedApiError(e, t, 'Failed to delete entry')),
  });
};

export const useParseSms = () => {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (sms: string) => entriesApi.parseSms(sms),
    onError: (e: unknown) => toast.error(localizedApiError(e, t, 'Could not parse SMS')),
  });
};

export const useUpdateProfile = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: { budget?: number }) => authApi.updateMe(payload),
    onSuccess: (user) => {
      const accessToken = useAuthStore.getState().accessToken;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (accessToken && refreshToken) {
        setAuth(user, accessToken, refreshToken);
      }
      toast.success(t('Profile updated'));
    },
    onError: (e: unknown) => toast.error(localizedApiError(e, t, 'Unable to update profile')),
  });
};

// ── Summary ──────────────────────────────────────────────────
export const useMonthlySummary = () => {
  const { month, year } = useMonthStore();
  return useQuery({
    queryKey: QK.summary(month, year),
    queryFn:  () => summaryApi.monthly(month, year),
  });
};

export const useCategoryBreakdown = () => {
  const { month, year } = useMonthStore();
  return useQuery({
    queryKey: QK.categories(month, year),
    queryFn:  () => summaryApi.categories(month, year),
  });
};

export const useYearlyTrend = () => {
  const { year } = useMonthStore();
  return useQuery({
    queryKey: QK.yearly(year),
    queryFn:  () => summaryApi.yearly(year),
  });
};

export const useYearlySummary = () => {
  const { year } = useMonthStore();
  return useQuery({
    queryKey: ['yearly-summary', year],
    queryFn:  () => summaryApi.yearlySummary(year),
  });
};

export const useAccountSummaries = (year?: number) => {
  return useQuery({
    queryKey: ['account-summaries', year],
    queryFn:  () => summaryApi.accounts(year),
  });
};

export const useBudgetWarnings = () => {
  return useQuery({
    queryKey: ['budget-warnings'],
    queryFn:  () => summaryApi.budgetWarnings(),
  });
};

// ── Categories ───────────────────────────────────────────────
export const useCategories = (type?: EntryType) =>
  useQuery({
    queryKey: QK.cats(type),
    queryFn:  () => categoriesApi.list(type),
  });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cats'] }); toast.success(t('Category created')); },
    onError: (e: unknown) => toast.error(localizedApiError(e, t, 'Failed to create category')),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: categoriesApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cats'] }); toast.success(t('Category deleted')); },
    onError: (e: unknown) => toast.error(localizedApiError(e, t, 'Cannot delete category')),
  });
};

// ── Accounts ──────────────────────────────────────────────────
export const useAccounts = () =>
  useQuery({
    queryKey: ['accounts'],
    queryFn:  () => accountsApi.list(),
  });

export const useCreateAccount = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: accountsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); toast.success(t('Account created')); },
    onError: (e: unknown) => toast.error(localizedApiError(e, t, 'Failed to create account')),
  });
};

export const useDeleteAccount = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: accountsApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); toast.success(t('Account deleted')); },
    onError: (e: unknown) => toast.error(localizedApiError(e, t, 'Cannot delete account')),
  });
};

export * from './useBudget';
export * from './budget.hooks';
