import { format, parseISO } from 'date-fns';
import { PaymentSource, EntryType } from '@/types';

// ── Currency ─────────────────────────────────────────────────
export const formatBDT = (amount: number): string =>
  '৳' + Math.abs(amount).toLocaleString('en-BD', { maximumFractionDigits: 0 });

export const formatBDTSigned = (amount: number): string =>
  (amount >= 0 ? '+' : '−') + formatBDT(amount);

// ── Dates ─────────────────────────────────────────────────────
export const formatDate = (iso: string): string =>
  format(parseISO(iso), 'dd MMM yyyy');

export const formatDateTime = (iso: string): string =>
  format(parseISO(iso), 'dd MMM yyyy, h:mm a');

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export const SHORT_MONTHS = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];

export const monthLabel = (month: number, year: number) =>
  `${MONTHS[month - 1]} ${year}`;

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
  savings:    'text-yellow-600',
  payable:    'text-red-600',
  receivable: 'text-blue-600',
};

// ── clsx tiny util ───────────────────────────────────────────
export const cx = (...classes: (string | undefined | null | false)[]): string =>
  classes.filter(Boolean).join(' ');
