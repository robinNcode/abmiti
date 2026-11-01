import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Calendar,
  XCircle,
  CreditCard,
  History,
  X,
  FileText,
} from 'lucide-react';
import {
  usePayables,
  usePayable,
  useCreatePayable,
  usePayPayable,
  useCancelPayable,
  useAccounts,
  useCategories,
} from '@/hooks';
import { PageHeader, Modal, EmptyState, Spinner } from '@/components/ui';
import { IPayable, PayableKind, PaymentSource } from '@/types';
import { formatBDT } from '@/utils';

export default function PayablesPage() {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'open' | 'settled' | 'cancelled'>('open');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [payingPayable, setPayingPayable] = useState<IPayable | null>(null);
  const [drawerPayableId, setDrawerPayableId] = useState<string | null>(null);

  const { data: payables = [], isLoading } = usePayables(filter === 'all' ? undefined : filter);

  // Stats calculation
  const openPayables = payables.filter((p) => p.status === 'open');
  const totalRemaining = openPayables.reduce((acc, p) => acc + (p.remaining ?? (p.principal - p.paidAmount)), 0);
  const totalPrincipal = openPayables.reduce((acc, p) => acc + p.principal, 0);

  const isOverdue = (payable: IPayable) => {
    if (payable.status !== 'open' || !payable.dueDate) return false;
    const due = new Date(payable.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  return (
    <div className="min-h-full">
      <PageHeader
        title={t('Payables')}
        subtitle={t('Track and settle your liabilities, loans, and credit payables')}
        action={
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            {t('Add Payable')}
          </button>
        }
      />

      <div className="px-4 md:px-8 space-y-6 pb-12">
        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5 border border-terra/20 bg-terra/5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">
              {t('Total Outstanding')}
            </p>
            <p className="font-display text-2xl font-bold text-terra mt-2">
              {formatBDT(totalRemaining)}
            </p>
            <p className="text-xs text-ink/40 mt-1">
              {openPayables.length} {t('open payables')}
            </p>
          </div>

          <div className="card p-5 border border-sage/20 bg-sage/5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">
              {t('Total Open Principal')}
            </p>
            <p className="font-display text-2xl font-bold text-sage mt-2">
              {formatBDT(totalPrincipal)}
            </p>
            <p className="text-xs text-ink/40 mt-1">
              {formatBDT(totalPrincipal - totalRemaining)} {t('paid down')}
            </p>
          </div>

          <div className="card p-5 border border-paper-mist2">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">
              {t('Overdue Payables')}
            </p>
            <p className="font-display text-2xl font-bold text-amber-600 mt-2">
              {openPayables.filter(isOverdue).length}
            </p>
            <p className="text-xs text-ink/40 mt-1">
              {t('Requiring urgent attention')}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-paper-mist2 pb-2">
          {(['open', 'settled', 'cancelled', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === tab
                  ? 'bg-ink text-paper font-semibold'
                  : 'text-ink/60 hover:text-ink hover:bg-paper-mist'
              }`}
            >
              {t(tab)}
            </button>
          ))}
        </div>

        {/* Payables List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-terra w-8 h-8" />
          </div>
        ) : payables.length === 0 ? (
          <EmptyState
            icon="💳"
            title={t('No payables found')}
            subtitle={t('Add loans or unpaid expenses to track your obligations')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {payables.map((payable) => {
              const remaining = payable.remaining ?? (payable.principal - payable.paidAmount);
              const progressPct = Math.min(100, Math.round((payable.paidAmount / payable.principal) * 100));
              const overdue = isOverdue(payable);

              return (
                <div
                  key={payable._id || payable.id}
                  className={`card p-5 border transition-shadow hover:shadow-md flex flex-col justify-between ${
                    overdue
                      ? 'border-red-300 bg-red-50/20'
                      : payable.status === 'settled'
                      ? 'border-sage/30 bg-sage/5 opacity-85'
                      : payable.status === 'cancelled'
                      ? 'border-paper-mist2 opacity-60'
                      : 'border-paper-mist2'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display font-bold text-base text-ink">
                          {payable.counterparty}
                        </h3>
                        <span className="inline-block mt-0.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-paper-mist text-ink/60">
                          {payable.kind === 'borrowed_cash'
                            ? t('Borrowed Cash')
                            : t('Unpaid Expense')}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                          payable.status === 'settled'
                            ? 'bg-sage/15 text-sage'
                            : payable.status === 'cancelled'
                            ? 'bg-paper-mist text-ink/40'
                            : overdue
                            ? 'bg-red-100 text-red-700 font-bold'
                            : 'bg-mustard/20 text-mustard'
                        }`}
                      >
                        {overdue ? t('Overdue') : t(payable.status)}
                      </span>
                    </div>

                    {payable.note && (
                      <p className="text-xs text-ink/60 mt-2 line-clamp-2">
                        {payable.note}
                      </p>
                    )}

                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-ink/50">{t('Remaining')}</span>
                        <span className="font-bold text-ink">
                          {formatBDT(remaining)}
                        </span>
                      </div>
                      <div className="h-2 bg-paper-mist rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            payable.status === 'settled' ? 'bg-sage' : 'bg-terra'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-ink/45">
                        <span>{t('Paid')}: {formatBDT(payable.paidAmount)} ({progressPct}%)</span>
                        <span>{t('Principal')}: {formatBDT(payable.principal)}</span>
                      </div>
                    </div>

                    {payable.dueDate && (
                      <div className={`flex items-center gap-1.5 text-xs mt-3 ${
                        overdue ? 'text-red-600 font-semibold' : 'text-ink/50'
                      }`}>
                        <Calendar size={13} />
                        <span>
                          {t('Due')}: {new Date(payable.dueDate).toLocaleDateString(i18n.language === 'bn' ? 'bn-BD' : 'en-US')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-paper-mist2 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setDrawerPayableId(payable._id || payable.id || null)}
                      className="text-xs text-ink/60 hover:text-ink font-medium flex items-center gap-1"
                    >
                      <History size={13} />
                      {t('History')}
                    </button>

                    <div className="flex items-center gap-2">
                      {payable.status === 'open' && (
                        <button
                          onClick={() => setPayingPayable(payable)}
                          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                        >
                          <CreditCard size={13} />
                          {t('Pay')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Payable Modal */}
      {createModalOpen && (
        <CreatePayableModal onClose={() => setCreateModalOpen(false)} />
      )}

      {/* Pay Modal */}
      {payingPayable && (
        <PayModal
          payable={payingPayable}
          onClose={() => setPayingPayable(null)}
        />
      )}

      {/* History Drawer */}
      {drawerPayableId && (
        <PayableDetailDrawer
          payableId={drawerPayableId}
          onClose={() => setDrawerPayableId(null)}
        />
      )}
    </div>
  );
}

// ── Create Modal ────────────────────────────────────────────────
function CreatePayableModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const createPayable = useCreatePayable();
  const { data: accounts = [] } = useAccounts();
  const { data: expenseCategories = [] } = useCategories('expense');

  const [counterparty, setCounterparty] = useState('');
  const [principal, setPrincipal] = useState('');
  const [kind, setKind] = useState<PayableKind>('borrowed_cash');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(principal);
    if (!counterparty.trim() || isNaN(amountNum) || amountNum <= 0) return;

    createPayable.mutate(
      {
        counterparty: counterparty.trim(),
        principal: amountNum,
        kind,
        accountId: kind === 'borrowed_cash' && accountId ? accountId : undefined,
        categoryId: categoryId || undefined,
        dueDate: dueDate || undefined,
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  return (
    <Modal open onClose={onClose} title={t('Add Payable')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
            {t('Counterparty / Creditor')} *
          </label>
          <input
            type="text"
            required
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            placeholder={t('e.g. Bank Asia, Brother Rahim, Landlord')}
            className="input w-full text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
              {t('Principal Amount')} (৳) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="0.00"
              className="input w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
              {t('Kind')}
            </label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as PayableKind)}
              className="input w-full text-sm"
            >
              <option value="borrowed_cash">{t('Borrowed Cash (Loan)')}</option>
              <option value="unpaid_expense">{t('Unpaid Expense (Credit)')}</option>
            </select>
          </div>
        </div>

        {kind === 'borrowed_cash' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
              {t('Credit To Account')} ({t('Optional')})
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="input w-full text-sm"
            >
              <option value="">{t('None / Cash')}</option>
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.name} ({formatBDT(acc.balance)})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-ink/40 mt-1">
              {t('Borrowed cash will increase the balance of this account.')}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
              {t('Default Expense Category')}
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input w-full text-sm"
            >
              <option value="">{t('Default / Payable Settlement')}</option>
              {expenseCategories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
              {t('Due Date')}
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input w-full text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
            {t('Note')}
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('Optional notes...')}
            className="input w-full text-sm"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            {t('Cancel')}
          </button>
          <button
            type="submit"
            disabled={createPayable.isPending}
            className="btn-primary text-sm flex items-center gap-2"
          >
            {createPayable.isPending && <Spinner className="w-4 h-4" />}
            {t('Create Payable')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Pay Modal ───────────────────────────────────────────────────
function PayModal({ payable, onClose }: { payable: IPayable; onClose: () => void }) {
  const { t } = useTranslation();
  const payMutation = usePayPayable();
  const { data: accounts = [] } = useAccounts();

  const remaining = payable.remaining ?? (payable.principal - payable.paidAmount);
  const [amount, setAmount] = useState(String(remaining));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [source, setSource] = useState<PaymentSource>('bank');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > remaining) return;

    payMutation.mutate(
      {
        id: payable._id || payable.id || '',
        dto: {
          amount: amountNum,
          date,
          source,
          accountId: accountId || undefined,
          note: note.trim() || undefined,
        },
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  return (
    <Modal open onClose={onClose} title={`${t('Settle / Pay')}: ${payable.counterparty}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-lg bg-paper-mist flex justify-between items-center text-xs">
          <span className="text-ink/60">{t('Remaining Balance')}:</span>
          <span className="font-bold text-sm text-terra">{formatBDT(remaining)}</span>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
            {t('Payment Amount')} (৳) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={remaining}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input w-full text-sm font-semibold"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
              {t('Payment Source')}
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as PaymentSource)}
              className="input w-full text-sm"
            >
              <option value="bank">{t('Bank')}</option>
              <option value="bkash">{t('bKash')}</option>
              <option value="nagad">{t('Nagad')}</option>
              <option value="cash">{t('Cash')}</option>
              <option value="card">{t('Card')}</option>
              <option value="other">{t('Other')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
              {t('From Account')} ({t('Optional')})
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="input w-full text-sm"
            >
              <option value="">{t('None / Cash')}</option>
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.name} ({formatBDT(acc.balance)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
            {t('Date')}
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-full text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
            {t('Note')}
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('e.g. Installment 1')}
            className="input w-full text-sm"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            {t('Cancel')}
          </button>
          <button
            type="submit"
            disabled={payMutation.isPending}
            className="btn-primary text-sm flex items-center gap-2"
          >
            {payMutation.isPending && <Spinner className="w-4 h-4" />}
            {t('Confirm Payment')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Detail Drawer ───────────────────────────────────────────────
function PayableDetailDrawer({
  payableId,
  onClose,
}: {
  payableId: string;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { data: payable, isLoading } = usePayable(payableId);
  const cancelMutation = useCancelPayable();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-paper card rounded-none shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-paper-mist2 flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-ink">
                {isLoading ? t('Loading...') : payable?.counterparty}
              </h2>
              <p className="text-xs text-ink/50 mt-0.5">
                {t('Payable Details & Settlement History')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-paper-mist flex items-center justify-center text-ink/60"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner className="text-terra w-6 h-6" />
              </div>
            ) : !payable ? (
              <p className="text-sm text-ink/50">{t('Payable not found')}</p>
            ) : (
              <>
                {/* Stats */}
                <div className="card p-4 bg-paper-mist border-0 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-ink/50">{t('Status')}</span>
                    <span className="font-semibold uppercase">{t(payable.status)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-ink/50">{t('Kind')}</span>
                    <span className="font-semibold">
                      {payable.kind === 'borrowed_cash'
                        ? t('Borrowed Cash')
                        : t('Unpaid Expense')}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-ink/50">{t('Principal')}</span>
                    <span className="font-bold">{formatBDT(payable.principal)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-ink/50">{t('Total Paid')}</span>
                    <span className="font-bold text-sage">{formatBDT(payable.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t border-paper-mist2">
                    <span className="text-ink/70 font-semibold">{t('Remaining Balance')}</span>
                    <span className="font-bold text-sm text-terra">
                      {formatBDT(payable.remaining ?? (payable.principal - payable.paidAmount))}
                    </span>
                  </div>
                </div>

                {/* Payments History */}
                <div>
                  <h3 className="font-display font-semibold text-sm text-ink mb-3 flex items-center gap-1.5">
                    <FileText size={15} />
                    {t('Payment Installments')} ({payable.payments?.length ?? 0})
                  </h3>

                  {(!payable.payments || payable.payments.length === 0) ? (
                    <div className="text-center py-8 text-xs text-ink/40 bg-paper-mist/40 rounded-xl">
                      {t('No payments made yet')}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {payable.payments.map((p) => (
                        <div
                          key={p._id}
                          className="p-3 rounded-lg border border-paper-mist2 bg-paper flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-semibold text-ink">
                              {formatBDT(p.amount)}
                            </p>
                            <p className="text-[11px] text-ink/45 mt-0.5">
                              {new Date(p.date).toLocaleDateString(i18n.language === 'bn' ? 'bn-BD' : 'en-US')} • {p.source}
                            </p>
                            {p.note && (
                              <p className="text-[11px] text-ink/60 mt-1">{p.note}</p>
                            )}
                          </div>
                          <span className="badge-expense text-[10px]">{t('expense')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cancel Action */}
                {payable.status === 'open' && payable.paidAmount === 0 && (
                  <div className="pt-4 border-t border-paper-mist2">
                    <button
                      onClick={() => {
                        if (confirm(t('Are you sure you want to cancel this payable?'))) {
                          cancelMutation.mutate(payable._id || payable.id || '', {
                            onSuccess: () => onClose(),
                          });
                        }
                      }}
                      disabled={cancelMutation.isPending}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1.5"
                    >
                      <XCircle size={14} />
                      {t('Cancel Payable')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
