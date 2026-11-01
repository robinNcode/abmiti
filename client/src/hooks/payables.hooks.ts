import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { payablesApi } from '@/api/payables.api';
import { CreatePayableDto, PayPayableDto, PatchPayableDto } from '@/types';
import { localizedApiError } from '@/utils';

export const payableQK = {
  all: ['payables'] as const,
  list: (status?: string) => ['payables', 'list', status] as const,
  detail: (id: string) => ['payables', 'detail', id] as const,
  netPosition: ['summary', 'net-position'] as const,
};

export const usePayables = (status?: string) =>
  useQuery({
    queryKey: payableQK.list(status),
    queryFn: () => payablesApi.list(status),
  });

export const usePayable = (id: string) =>
  useQuery({
    queryKey: payableQK.detail(id),
    queryFn: () => payablesApi.getById(id),
    enabled: Boolean(id),
  });

export const useNetPosition = () =>
  useQuery({
    queryKey: payableQK.netPosition,
    queryFn: () => payablesApi.getNetPosition(),
  });

export const useCreatePayable = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (dto: CreatePayableDto) => payablesApi.create(dto),
    onSuccess: () => {
      toast.success(t('Payable created successfully'));
      void qc.invalidateQueries({ queryKey: payableQK.all });
      void qc.invalidateQueries({ queryKey: ['accounts'] });
      void qc.invalidateQueries({ queryKey: payableQK.netPosition });
    },
    onError: (err: unknown) => {
      toast.error(localizedApiError(err, t, 'Failed to create payable'));
    },
  });
};

export const usePayPayable = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: PayPayableDto }) =>
      payablesApi.pay(id, dto),
    onSuccess: (_, { id }) => {
      toast.success(t('Payment recorded successfully'));
      void qc.invalidateQueries({ queryKey: payableQK.all });
      void qc.invalidateQueries({ queryKey: payableQK.detail(id) });
      void qc.invalidateQueries({ queryKey: ['entries'] });
      void qc.invalidateQueries({ queryKey: ['accounts'] });
      void qc.invalidateQueries({ queryKey: payableQK.netPosition });
      void qc.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (err: unknown) => {
      toast.error(localizedApiError(err, t, 'Payment failed'));
    },
  });
};

export const usePatchPayable = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: PatchPayableDto }) =>
      payablesApi.patch(id, dto),
    onSuccess: (_, { id }) => {
      toast.success(t('Payable updated'));
      void qc.invalidateQueries({ queryKey: payableQK.all });
      void qc.invalidateQueries({ queryKey: payableQK.detail(id) });
    },
    onError: (err: unknown) => {
      toast.error(localizedApiError(err, t, 'Failed to update payable'));
    },
  });
};

export const useCancelPayable = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => payablesApi.cancel(id),
    onSuccess: () => {
      toast.success(t('Payable cancelled'));
      void qc.invalidateQueries({ queryKey: payableQK.all });
      void qc.invalidateQueries({ queryKey: payableQK.netPosition });
    },
    onError: (err: unknown) => {
      toast.error(localizedApiError(err, t, 'Failed to cancel payable'));
    },
  });
};
