import { parseISO } from 'date-fns';
import { PaymentSource, EntryType } from '@/types';
import i18n from '@/i18n';
import type { TFunction } from 'i18next';

const currentLocale = () => i18n.language === 'bn' ? 'bn-BD' : 'en-BD';
export const formatNumber = (value: number): string =>
  new Intl.NumberFormat(currentLocale()).format(value);
export const formatCompactNumber = (value: number): string =>
  new Intl.NumberFormat(currentLocale(), { notation: 'compact' }).format(value);
export const formatShortMonth = (month: number): string =>
  new Intl.DateTimeFormat(currentLocale(), { month: 'short' }).format(new Date(2025, month - 1, 1));
// ── Currency ─────────────────────────────────────────────────
export const formatBDT = (amount: number): string =>
  '৳' + Math.abs(amount).toLocaleString(currentLocale(), { maximumFractionDigits: 0 });

export const formatBDTSigned = (amount: number): string =>
  (amount >= 0 ? '+' : '−') + formatBDT(amount);

// ── Dates ─────────────────────────────────────────────────────
export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat(currentLocale(), { day: '2-digit', month: 'short', year: 'numeric' }).format(parseISO(iso));

export const formatDateTime = (iso: string): string =>
  new Intl.DateTimeFormat(currentLocale(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parseISO(iso));

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export const SHORT_MONTHS = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];

export const monthLabel = (month: number, year: number) =>
  new Intl.DateTimeFormat(currentLocale(), { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));

// ── Source badge styles ───────────────────────────────────────
export const sourceBadgeClass: Record<PaymentSource, string> = {
  bank:  'badge-bank',
  bkash: 'badge-bkash',
  nagad: 'badge-nagad',
  cash:  'badge-cash',
  card:  'badge-cash',
  other: 'badge-cash',
};

export const sourceLabel: Record<PaymentSource, string> = {
  bank:  '🏦 Bank',
  bkash: '📱 bKash',
  nagad: '💚 Nagad',
  cash:  '💵 Cash',
  card:  '💳 Card',
  other: '📦 Other',
};

export const typeColor: Record<EntryType, string> = {
  income:     'text-sage',
  expense:    'text-terra',
  investment: 'text-yellow-500',
  savings:    'text-yellow-600',
  payable:    'text-red-600',
  receivable: 'text-blue-600',
};

// ── clsx tiny util ───────────────────────────────────────────
export const cx = (...classes: (string | undefined | null | false)[]): string =>
  classes.filter(Boolean).join(' ');

export const localizedApiError = (
  error: unknown,
  t: TFunction,
  fallbackKey = 'Something went wrong',
): string => {
  const asRecord = (value: unknown): Record<string, unknown> | undefined =>
    typeof value === 'object' && value !== null ? value as Record<string, unknown> : undefined;
  const message = asRecord(asRecord(asRecord(error)?.response)?.data)?.message;
  return typeof message === 'string' ? t(message, { defaultValue: t(fallbackKey) }) : t(fallbackKey);
};

export const getImageUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const host = baseUrl.replace('/api/v1', '');
  return `${host}${path}`;
};
