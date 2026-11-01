import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { receivablesApi } from '@/api/receivables.api';
import { CreateReceivableDto, CollectReceivableDto, PatchReceivableDto } from '@/types';
import { localizedApiError } from '@/utils';
import { payableQK } from './payables.hooks';

export const receivableQK = {
  all: ['receivables'] as const,
  list: (status?: string) => ['receivables', 'list', status] as const,
  detail: (id: string) => ['receivables', 'detail', id] as const,
};

export const useReceivables = (status?: string) =>
  useQuery({
    queryKey: receivableQK.list(status),
    queryFn: () => receivablesApi.list(status),
  });

export const useReceivable = (id: string) =>
  useQuery({
    queryKey: receivableQK.detail(id),
    queryFn: () => receivablesApi.getById(id),
    enabled: Boolean(id),
  });

export const useCreateReceivable = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (dto: CreateReceivableDto) => receivablesApi.create(dto),
    onSuccess: () => {
      toast.success(t('Receivable created successfully'));
      void qc.invalidateQueries({ queryKey: receivableQK.all });
      void qc.invalidateQueries({ queryKey: ['accounts'] });
      void qc.invalidateQueries({ queryKey: payableQK.netPosition });
    },
    onError: (err: unknown) => {
      toast.error(localizedApiError(err, t, 'Failed to create receivable'));
    },
  });
};

export const useCollectReceivable = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CollectReceivableDto }) =>
      receivablesApi.collect(id, dto),
    onSuccess: (_, { id }) => {
      toast.success(t('Collection recorded successfully'));
      void qc.invalidateQueries({ queryKey: receivableQK.all });
      void qc.invalidateQueries({ queryKey: receivableQK.detail(id) });
      void qc.invalidateQueries({ queryKey: ['entries'] });
      void qc.invalidateQueries({ queryKey: ['accounts'] });
      void qc.invalidateQueries({ queryKey: payableQK.netPosition });
      void qc.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (err: unknown) => {
      toast.error(localizedApiError(err, t, 'Collection failed'));
    },
  });
};

export const usePatchReceivable = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: PatchReceivableDto }) =>
      receivablesApi.patch(id, dto),
    onSuccess: (_, { id }) => {
      toast.success(t('Receivable updated'));
      void qc.invalidateQueries({ queryKey: receivableQK.all });
      void qc.invalidateQueries({ queryKey: receivableQK.detail(id) });
    },
    onError: (err: unknown) => {
      toast.error(localizedApiError(err, t, 'Failed to update receivable'));
    },
  });
};

export const useCancelReceivable = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => receivablesApi.cancel(id),
    onSuccess: () => {
      toast.success(t('Receivable cancelled'));
      void qc.invalidateQueries({ queryKey: receivableQK.all });
      void qc.invalidateQueries({ queryKey: payableQK.netPosition });
    },
    onError: (err: unknown) => {
      toast.error(localizedApiError(err, t, 'Failed to cancel receivable'));
    },
  });
};

export const useDeleteReceivable = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => receivablesApi.remove(id),
    onSuccess: () => {
      toast.success(t('Receivable deleted'));
      void qc.invalidateQueries({ queryKey: receivableQK.all });
      void qc.invalidateQueries({ queryKey: payableQK.netPosition });
    },
    onError: (err: unknown) => {
      toast.error(localizedApiError(err, t, 'Failed to delete receivable'));
    },
  });
};
