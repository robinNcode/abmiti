import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { entriesApi } from '@/api/entries.api';
import { categoriesApi, summaryApi } from '@/api/summary.api';
import { accountsApi } from '@/api/accounts.api';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import { useMonthStore } from '@/store/monthStore';
import { CreateEntryDto, EntryType } from '@/types';

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
  return useMutation({
    mutationFn: (dto: CreateEntryDto) => entriesApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entries'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
      qc.invalidateQueries({ queryKey: ['categories-breakdown'] });
      qc.invalidateQueries({ queryKey: ['yearly'] });
      toast.success('Entry saved ✓');
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to save entry';
      toast.error(msg);
    },
  });
};

export const useDeleteEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => entriesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entries'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
      qc.invalidateQueries({ queryKey: ['categories-breakdown'] });
      toast.success('Entry deleted');
    },
  });
};

export const useParseSms = () =>
  useMutation({
    mutationFn: (sms: string) => entriesApi.parseSms(sms),
    onError: () => toast.error('Could not parse SMS'),
  });

export const useUpdateProfile = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (payload: { budget?: number }) => authApi.updateMe(payload),
    onSuccess: (user) => {
      const accessToken = useAuthStore.getState().accessToken;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (accessToken && refreshToken) {
        setAuth(user, accessToken, refreshToken);
      }
      toast.success('Profile updated');
    },
    onError: () => toast.error('Unable to update profile'),
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

// ── Categories ───────────────────────────────────────────────
export const useCategories = (type?: EntryType) =>
  useQuery({
    queryKey: QK.cats(type),
    queryFn:  () => categoriesApi.list(type),
  });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cats'] }); toast.success('Category created'); },
    onError: () => toast.error('Failed to create category'),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cats'] }); toast.success('Category deleted'); },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Cannot delete category';
      toast.error(msg);
    },
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
  return useMutation({
    mutationFn: accountsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); toast.success('Account created'); },
    onError: () => toast.error('Failed to create account'),
  });
};

export const useDeleteAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: accountsApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); toast.success('Account deleted'); },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Cannot delete account';
      toast.error(msg);
    },
  });
};
