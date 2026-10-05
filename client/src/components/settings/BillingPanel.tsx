import { useMemo, useState } from 'react';
import { addMonths, differenceInCalendarDays, format, parseISO } from 'date-fns';
import {
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Receipt,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  Undo2,
  Wallet,
} from 'lucide-react';
import { cx, formatBDT } from '@/utils';

// ── Types ────────────────────────────────────────────────────
type SubStatus = 'active' | 'expiring' | 'expired' | 'cancelled';
type BillingCycle = 'monthly' | 'yearly';

interface Subscription {
  plan: string;
  status: SubStatus;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  startsAt: string;
  expiresAt: string;
  transactionId: string;
  seats: number;
}

interface PaymentRecord {
  _id: string;
  transactionId: string;
  date: string;
  amount: number;
  method: string;
  status: 'paid' | 'pending' | 'refunded';
  invoice: string;
}

type HistoryFilter = 'all' | PaymentRecord['status'];

const HISTORY_TABS: { key: HistoryFilter; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'paid',     label: 'Paid' },
  { key: 'pending',  label: 'Pending' },
  { key: 'refunded', label: 'Refunded' },
];

// ── Design-only mock data (replace with real API data later) ─
const now = new Date();

const subscription: Subscription = {
  plan: 'Pro',
  status: 'expiring',
  billingCycle: 'yearly',
  amount: 1200,
  currency: 'BDT',
  startsAt: addMonths(now, -11).toISOString(),
  expiresAt: addMonths(now, 1).toISOString(),
  transactionId: 'SSLCOM-8F2A19C4',
  seats: 1,
};

const paymentHistory: PaymentRecord[] = [
  {
    _id: 'p1',
    transactionId: 'SSLCOM-8F2A19C4',
    date: addMonths(now, -11).toISOString(),
    amount: 1200,
    method: 'bKash',
    status: 'paid',
    invoice: 'INV-2026-0142',
  },
  {
    _id: 'p2',
    transactionId: 'SSLCOM-1B7E55D0',
    date: addMonths(now, -23).toISOString(),
    amount: 1200,
    method: 'Nagad',
    status: 'paid',
    invoice: 'INV-2025-0097',
  },
  {
    _id: 'p3',
    transactionId: 'SSLCOM-C40D7A18',
    date: addMonths(now, -2).toISOString(),
    amount: 350,
    method: 'Card ····4821',
    status: 'refunded',
    invoice: 'INV-2026-0203',
  },
  {
    _id: 'p4',
    transactionId: 'SSLCOM-2E91BB63',
    date: now.toISOString(),
    amount: 1200,
    method: 'bKash',
    status: 'pending',
    invoice: 'INV-2026-0211',
  },
];

const statusStyles: Record<SubStatus, { label: string; cls: string; dot: string }> = {
  active:    { label: 'Active',       cls: 'bg-sage/10 text-sage border-sage/20',           dot: 'bg-sage' },
  expiring:  { label: 'Expiring Soon', cls: 'bg-mustard/15 text-mustard-dark border-mustard/25', dot: 'bg-mustard' },
  expired:   { label: 'Expired',      cls: 'bg-terra/10 text-terra border-terra/20',         dot: 'bg-terra' },
  cancelled: { label: 'Cancelled',    cls: 'bg-ink/5 text-ink/50 border-ink/10',             dot: 'bg-ink/40' },
};

const paymentStatusStyles: Record<PaymentRecord['status'], string> = {
  paid:     'bg-sage/10 text-sage border-sage/20',
  pending:  'bg-mustard/15 text-mustard-dark border-mustard/25',
  refunded: 'bg-ink/5 text-ink/50 border-ink/10',
};

const DAY_MS = 86_400_000;

export default function BillingPanel() {
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');

  const startsAt = parseISO(subscription.startsAt);
  const expiresAt = parseISO(subscription.expiresAt);

  const daysLeft = differenceInCalendarDays(expiresAt, now);
  const isActive = subscription.status === 'active' || subscription.status === 'expiring';

  const totalDays = Math.max(
    1,
    Math.round((expiresAt.getTime() - startsAt.getTime()) / DAY_MS),
  );
  const elapsedDays = Math.min(totalDays, Math.max(0, totalDays - daysLeft));
  const progress = Math.round((elapsedDays / totalDays) * 100);

  const badge = statusStyles[subscription.status];

  const filteredPayments = useMemo(
    () =>
      historyFilter === 'all'
        ? paymentHistory
        : paymentHistory.filter((p) => p.status === historyFilter),
    [historyFilter],
  );

  return (
    <div className="space-y-4 w-full">
      {/* ── Active Plan Hero Card ─────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-terra to-terra-light px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
                  Current Plan
                </p>
                <h2 className="font-display text-2xl font-bold leading-tight">{subscription.plan}</h2>
              </div>
            </div>
            <span
              className={cx(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold bg-white/20 border-white/30 backdrop-blur shrink-0',
              )}
            >
              <span className={cx('w-1.5 h-1.5 rounded-full', isActive ? 'bg-white' : 'bg-white/60')} />
              {badge.label}
            </span>
          </div>
        </div>

        <div className="p-6">
          {/* Countdown */}
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">
                {daysLeft > 0 ? 'Days remaining' : 'Expired on'}
              </p>
              <p className="font-display text-3xl font-bold text-ink mt-0.5">
                {daysLeft > 0 ? daysLeft : format(expiresAt, 'dd MMM yyyy')}
                {daysLeft > 0 && (
                  <span className="text-base font-semibold text-ink/40 ml-1.5">days</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink/50">Renews on</p>
              <p className="font-semibold text-sm text-ink mt-0.5">
                {format(expiresAt, 'dd MMM yyyy')}
              </p>
            </div>
          </div>

          {/* Period progress */}
          <div className="h-2 w-full rounded-full bg-paper-mist overflow-hidden">
            <div
              className={cx(
                'h-full rounded-full transition-all duration-500',
                isActive ? 'bg-terra' : 'bg-ink/20',
              )}
              style={{ width: `${Math.min(100, Math.max(3, progress))}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[11px] text-ink/40">
            <span>Started {format(startsAt, 'dd MMM yyyy')}</span>
            <span>{progress}% of period used</span>
            <span>Ends {format(expiresAt, 'dd MMM yyyy')}</span>
          </div>

          {/* Status banner */}
          {daysLeft > 0 && daysLeft <= 30 ? (
            <div className="flex items-start gap-2.5 mt-5 bg-mustard/10 border border-mustard/25 text-mustard-dark rounded-xl px-4 py-3 text-sm">
              <TriangleAlert size={16} className="shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Your {subscription.plan} plan expires in <strong>{daysLeft} days</strong>. Renew now to
                keep premium features uninterrupted.
              </p>
            </div>
          ) : !isActive ? (
            <div className="flex items-start gap-2.5 mt-5 bg-terra/10 border border-terra/20 text-terra rounded-xl px-4 py-3 text-sm">
              <Clock size={16} className="shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                This subscription is no longer active. Renew to restore your premium features.
              </p>
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button className="btn-primary flex-1">
              <RefreshCw size={14} />
              {isActive ? 'Renew Plan' : 'Reactivate Plan'}
            </button>
            <button className="btn-ghost flex-1">
              <Sparkles size={14} />
              Upgrade Plan
            </button>
            {isActive && (
              <button className="btn-ghost text-terra hover:border-terra/30 hover:bg-terra/5">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Plan Details ───────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <BadgeCheck size={16} className="text-terra" />
          <h3 className="font-display font-bold text-lg">Plan Details</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Plan',           value: subscription.plan,                          mono: false },
            { label: 'Status',         value: badge.label,                                mono: false },
            { label: 'Billing Cycle',  value: subscription.billingCycle === 'yearly' ? 'Yearly' : 'Monthly', mono: false },
            { label: 'Seats',          value: `${subscription.seats} ${subscription.seats === 1 ? 'user' : 'users'}`, mono: false },
            { label: 'Started On',     value: format(startsAt, 'dd MMM yyyy'),           mono: false },
            { label: 'Expires On',     value: format(expiresAt, 'dd MMM yyyy'),           mono: false },
            { label: 'Amount Paid',    value: formatBDT(subscription.amount),              mono: false },
            { label: 'Transaction ID', value: subscription.transactionId,                 mono: true  },
          ].map((row) => (
            <div key={row.label} className="p-4 bg-paper-mist/60 border border-paper-mist2 rounded-xl">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45">{row.label}</p>
              <p className={cx(
                'text-sm font-semibold text-ink mt-1 truncate',
                row.mono && 'font-mono text-xs',
              )}>
                {row.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 mt-4 px-4 py-3 bg-terra/5 border border-terra/15 rounded-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <CreditCard size={15} className="text-terra shrink-0" />
            <span className="text-sm text-ink/70">Total paid for this period</span>
          </div>
          <span className="font-display text-xl font-bold text-terra shrink-0">
            {formatBDT(subscription.amount)}
          </span>
        </div>
      </div>

      {/* ── Payment Method ─────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-terra" />
            <h3 className="font-display font-bold text-lg">Payment Method</h3>
          </div>
          <button className="text-xs font-semibold text-terra hover:underline">Change</button>
        </div>

        <div className="flex items-center gap-4 p-4 bg-paper-mist rounded-xl border border-paper-mist2">
          <div className="w-11 h-11 rounded-lg bg-bkash text-white flex items-center justify-center shrink-0">
            <CreditCard size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-ink">bKash</p>
            <p className="text-xs text-ink/50 font-mono">017•• ••••42</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-sage/10 text-sage border border-sage/20 px-2.5 py-1 text-[11px] font-semibold shrink-0">
            <CheckCircle2 size={11} />
            Default
          </span>
        </div>

        <div className="flex items-center gap-4 p-4 bg-paper-mist rounded-xl border border-paper-mist2 mt-3 opacity-60">
          <div className="w-11 h-11 rounded-lg bg-paper-mist2 text-ink/40 flex items-center justify-center shrink-0">
            <CreditCard size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-ink">Add payment method</p>
            <p className="text-xs text-ink/50">Card, Nagad or bank transfer</p>
          </div>
        </div>
      </div>

      {/* ── Payment History ────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 border-b border-paper-mist2">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-terra" />
            <h3 className="font-display font-bold text-lg">Payment History</h3>
          </div>
          <button className="text-xs font-semibold text-terra hover:underline self-start sm:self-auto">
            View all
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="px-6 pt-4">
          <div className="flex gap-1 p-1 bg-paper-mist rounded-xl overflow-x-auto">
            {HISTORY_TABS.map((t) => {
              const count = t.key === 'all'
                ? paymentHistory.length
                : paymentHistory.filter((p) => p.status === t.key).length;

              return (
                <button
                  key={t.key}
                  onClick={() => setHistoryFilter(t.key)}
                  className={cx(
                    'flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all',
                    historyFilter === t.key
                      ? 'bg-white text-terra shadow-sm'
                      : 'text-ink/50 hover:text-ink',
                  )}
                >
                  {t.label}
                  <span
                    className={cx(
                      'rounded-full px-1.5 text-[10px] font-bold leading-4',
                      historyFilter === t.key ? 'bg-terra/10 text-terra' : 'bg-paper-mist2 text-ink/40',
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="divide-y divide-paper-mist2 mt-4">
          {filteredPayments.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-paper-mist text-ink/25 flex items-center justify-center mx-auto mb-2">
                <Receipt size={18} />
              </div>
              <p className="text-sm font-semibold text-ink/70">No {HISTORY_TABS.find((t) => t.key === historyFilter)?.label.toLowerCase()} payments</p>
              <p className="text-xs text-ink/45 mt-1">Transactions matching this filter will appear here.</p>
            </div>
          ) : (
            filteredPayments.map((p) => (
            <div key={p._id} className="flex items-center gap-4 px-6 py-4 hover:bg-paper-mist/50 transition-colors">
              <div
                className={cx(
                  'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                  p.status === 'paid' && 'bg-sage/10 text-sage',
                  p.status === 'pending' && 'bg-mustard/15 text-mustard-dark',
                  p.status === 'refunded' && 'bg-ink/5 text-ink/40',
                )}
              >
                {p.status === 'paid' && <Calendar size={15} />}
                {p.status === 'pending' && <Clock size={15} />}
                {p.status === 'refunded' && <Undo2 size={15} />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-ink truncate">
                  {subscription.plan} · {subscription.billingCycle}
                </p>
                <p className="text-xs text-ink/50 font-mono truncate mt-0.5">
                  {p.transactionId} · {format(parseISO(p.date), 'dd MMM yyyy')}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-semibold text-sm text-ink">{formatBDT(p.amount)}</p>
                <p className="text-xs text-ink/50 mt-0.5">{p.method}</p>
              </div>

              <span
                className={cx(
                  'hidden sm:inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize shrink-0',
                  paymentStatusStyles[p.status],
                )}
              >
                {p.status}
              </span>

              <button
                disabled={p.status !== 'paid'}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink/40 hover:text-terra hover:bg-terra/5 transition-colors shrink-0 disabled:text-ink/15 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              >
                <Download size={15} />
              </button>
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}