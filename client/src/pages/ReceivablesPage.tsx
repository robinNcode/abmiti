import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Calendar,
  XCircle,
  History,
  X,
  FileText,
  ArrowDownLeft,
  Trash2,
} from 'lucide-react';
import {
  useReceivables,
  useReceivable,
  useCreateReceivable,
  useCollectReceivable,
  usePatchReceivable,
  useCancelReceivable,
  useDeleteReceivable,
  useAccounts,
  useCategories,
} from '@/hooks';
import { PageHeader, Modal, EmptyState, Spinner } from '@/components/ui';
import { IReceivable, ReceivableKind, PaymentSource } from '@/types';
import { formatBDT } from '@/utils';

export default function ReceivablesPage() {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'open' | 'settled' | 'cancelled'>('open');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [collectingReceivable, setCollectingReceivable] = useState<IReceivable | null>(null);
  const [drawerReceivableId, setDrawerReceivableId] = useState<string | null>(null);

  const { data: receivables = [], isLoading } = useReceivables(filter === 'all' ? undefined : filter);

  // Stats calculation
  const openReceivables = receivables.filter((r) => r.status === 'open');
  const totalRemaining = openReceivables.reduce(
    (acc, r) => acc + (r.remaining ?? (r.principal - r.receivedAmount)),
    0
  );
  const totalPrincipal = openReceivables.reduce((acc, r) => acc + r.principal, 0);
  const totalReceived = openReceivables.reduce((acc, r) => acc + r.receivedAmount, 0);

  const isOverdue = (receivable: IReceivable) => {
    if (receivable.status !== 'open' || !receivable.dueDate) return false;
    const due = new Date(receivable.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  return (
    <div className="min-h-full">
      <PageHeader
        title={t('Receivables')}
        subtitle={t('Track and collect money owed to you, lent cash, and unpaid income')}
        action={
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn-sage flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            {t('Add Receivable')}
          </button>
        }
      />

      <div className="px-4 md:px-8 space-y-6 pb-12">
        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5 border border-sage/20 bg-sage/5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">
              {t('Total Outstanding Receivable')}
            </p>
            <p className="font-display text-2xl font-bold text-sage mt-2">
              {formatBDT(totalRemaining)}
            </p>
            <p className="text-xs text-ink/40 mt-1">
              {openReceivables.length} {t('open receivables')}
            </p>
          </div>

          <div className="card p-5 border border-blue-500/20 bg-blue-50/40">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">
              {t('Total Collected')}
            </p>
            <p className="font-display text-2xl font-bold text-blue-600 mt-2">
              {formatBDT(totalReceived)}
            </p>
            <p className="text-xs text-ink/40 mt-1">
              {totalPrincipal > 0
                ? `${Math.round((totalReceived / totalPrincipal) * 100)}% ${t('collected so far')}`
                : t('collected so far')}
            </p>
          </div>

          <div className="card p-5 border border-paper-mist2">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">
              {t('Overdue Receivables')}
            </p>
            <p className="font-display text-2xl font-bold text-amber-600 mt-2">
              {openReceivables.filter(isOverdue).length}
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

        {/* Receivables List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-sage w-8 h-8" />
          </div>
        ) : receivables.length === 0 ? (
          <EmptyState
            icon="📥"
            title={t('No receivables found')}
            subtitle={t('Add loans given or unpaid income to track what you are owed')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {receivables.map((receivable) => {
              const remaining =
                receivable.remaining ?? (receivable.principal - receivable.receivedAmount);
              const progressPct = Math.min(
                100,
                Math.round((receivable.receivedAmount / receivable.principal) * 100)
              );
              const overdue = isOverdue(receivable);

              return (
                <div
                  key={receivable._id || receivable.id}
                  className={`card p-5 border transition-shadow hover:shadow-md flex flex-col justify-between ${
                    overdue
                      ? 'border-red-300 bg-red-50/20'
                      : receivable.status === 'settled'
                      ? 'border-sage/30 bg-sage/5 opacity-85'
                      : receivable.status === 'cancelled'
                      ? 'border-paper-mist2 opacity-60'
                      : 'border-paper-mist2'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display font-bold text-base text-ink">
                          {receivable.counterparty}
                        </h3>
                        <span className="inline-block mt-0.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-paper-mist text-ink/60">
                          {receivable.kind === 'lent_cash'
                            ? t('Lent Cash')
                            : t('Unpaid Income')}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                          receivable.status === 'settled'
                            ? 'bg-sage/15 text-sage'
                            : receivable.status === 'cancelled'
                            ? 'bg-paper-mist text-ink/40'
                            : overdue
                            ? 'bg-red-100 text-red-700 font-bold'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {overdue ? t('Overdue') : t(receivable.status)}
                      </span>
                    </div>

                    {receivable.note && (
                      <p className="text-xs text-ink/60 mt-2 line-clamp-2">
                        {receivable.note}
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
                            receivable.status === 'settled' ? 'bg-sage' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-ink/45">
                        <span>
                          {t('Received')}: {formatBDT(receivable.receivedAmount)} ({progressPct}%)
                        </span>
                        <span>{t('Principal')}: {formatBDT(receivable.principal)}</span>
                      </div>
                    </div>

                    {receivable.dueDate && (
                      <div
                        className={`flex items-center gap-1.5 text-xs mt-3 ${
                          overdue ? 'text-red-600 font-semibold' : 'text-ink/50'
                        }`}
                      >
                        <Calendar size={13} />
                        <span>
                          {t('Due')}:{' '}
                          {new Date(receivable.dueDate).toLocaleDateString(
                            i18n.language === 'bn' ? 'bn-BD' : 'en-US'
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-paper-mist2 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setDrawerReceivableId(receivable._id || receivable.id || null)}
                      className="text-xs text-ink/60 hover:text-ink font-medium flex items-center gap-1"
                    >
                      <History size={13} />
                      {t('History')}
                    </button>

                    <div className="flex items-center gap-2">
                      {receivable.status === 'open' && (
                        <button
                          onClick={() => setCollectingReceivable(receivable)}
                          className="btn-sage text-xs py-1.5 px-3 flex items-center gap-1"
                        >
                          <ArrowDownLeft size={13} />
                          {t('Collect')}
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

      {/* Add Receivable Modal */}
      {createModalOpen && (
        <CreateReceivableModal onClose={() => setCreateModalOpen(false)} />
      )}

      {/* Collect Modal */}
      {collectingReceivable && (
        <CollectModal
          receivable={collectingReceivable}
          onClose={() => setCollectingReceivable(null)}
        />
      )}

      {/* History Drawer */}
      {drawerReceivableId && (
        <ReceivableDetailDrawer
          receivableId={drawerReceivableId}
          onClose={() => setDrawerReceivableId(null)}
        />
      )}
    </div>
  );
}

// ── Create Modal ────────────────────────────────────────────────
function CreateReceivableModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const createReceivable = useCreateReceivable();
  const { data: accounts = [] } = useAccounts();
  const { data: incomeCategories = [] } = useCategories('income');

  const [counterparty, setCounterparty] = useState('');
  const [principal, setPrincipal] = useState('');
  const [kind, setKind] = useState<ReceivableKind>('lent_cash');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(principal);
    if (!counterparty.trim() || isNaN(amountNum) || amountNum <= 0) return;

    createReceivable.mutate(
      {
        counterparty: counterparty.trim(),
        principal: amountNum,
        kind,
        accountId: kind === 'lent_cash' && accountId ? accountId : undefined,
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
    <Modal open onClose={onClose} title={t('Add Receivable')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
            {t('Counterparty / Debtor')} *
          </label>
          <input
            type="text"
            required
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            placeholder={t('e.g. Client Karim, Friend Hasan, Shop Buyer')}
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
              onChange={(e) => setKind(e.target.value as ReceivableKind)}
              className="input w-full text-sm"
            >
              <option value="lent_cash">{t('Lent Cash (Loan)')}</option>
              <option value="unpaid_income">{t('Unpaid Income (Pending)')}</option>
            </select>
          </div>
        </div>

        {kind === 'lent_cash' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
              {t('Debit From Account')} ({t('Optional')})
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
              {t('Lent cash will deduct the principal from this account.')}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
              {t('Default Income Category')}
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input w-full text-sm"
            >
              <option value="">{t('Default / Receivable Settlement')}</option>
              {incomeCategories.map((c) => (
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
            disabled={createReceivable.isPending}
            className="btn-sage text-sm flex items-center gap-2"
          >
            {createReceivable.isPending && <Spinner className="w-4 h-4" />}
            {t('Create Receivable')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Collect Modal ───────────────────────────────────────────────
function CollectModal({
  receivable,
  onClose,
}: {
  receivable: IReceivable;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const collectMutation = useCollectReceivable();
  const { data: accounts = [] } = useAccounts();

  const remaining =
    receivable.remaining ?? (receivable.principal - receivable.receivedAmount);
  const [amount, setAmount] = useState(String(remaining));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [source, setSource] = useState<PaymentSource>('bank');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > remaining) return;

    collectMutation.mutate(
      {
        id: receivable._id || receivable.id || '',
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
    <Modal
      open
      onClose={onClose}
      title={`${t('Collect / Settle')}: ${receivable.counterparty}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-lg bg-paper-mist flex justify-between items-center text-xs">
          <span className="text-ink/60">{t('Remaining Balance')}:</span>
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-sage">{formatBDT(remaining)}</span>
            <button
              type="button"
              onClick={() => setAmount(String(remaining))}
              className="text-[11px] underline text-blue-600 hover:text-blue-800"
            >
              {t('Collect Full Balance')}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1">
            {t('Collection Amount')} (৳) *
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
              {t('Deposit To Account')} ({t('Optional')})
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
            disabled={collectMutation.isPending}
            className="btn-sage text-sm flex items-center gap-2"
          >
            {collectMutation.isPending && <Spinner className="w-4 h-4" />}
            {t('Collect Payment')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Detail Drawer ───────────────────────────────────────────────
function ReceivableDetailDrawer({
  receivableId,
  onClose,
}: {
  receivableId: string;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { data: receivable, isLoading } = useReceivable(receivableId);
  const cancelMutation = useCancelReceivable();
  const deleteMutation = useDeleteReceivable();
  const patchMutation = usePatchReceivable();

  const [editingDueDate, setEditingDueDate] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');

  const handleUpdateDueDate = () => {
    patchMutation.mutate(
      {
        id: receivableId,
        dto: { dueDate: newDueDate || null },
      },
      {
        onSuccess: () => setEditingDueDate(false),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-paper card rounded-none shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-paper-mist2 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">
                {isLoading ? t('Loading...') : receivable?.counterparty}
              </h2>
              <p className="text-xs text-ink/50 mt-0.5">
                {t('Receivable Details & Collection History')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-paper-mist text-ink/60 hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Spinner className="text-sage w-8 h-8" />
            </div>
          ) : !receivable ? (
            <div className="flex-1 flex items-center justify-center p-6 text-sm text-ink/60">
              {t('Receivable not found')}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status and kind badges */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                    receivable.status === 'settled'
                      ? 'bg-sage/15 text-sage'
                      : receivable.status === 'cancelled'
                      ? 'bg-paper-mist text-ink/40'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {t(receivable.status)}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-paper-mist font-semibold text-ink/60">
                  {receivable.kind === 'lent_cash'
                    ? t('Lent Cash (Loan)')
                    : t('Unpaid Income (Pending)')}
                </span>
              </div>

              {/* Progress Summary Card */}
              <div className="card p-4 bg-paper-mist/40 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-ink/60">{t('Total Principal')}</span>
                  <span className="font-bold text-ink">{formatBDT(receivable.principal)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-ink/60">{t('Total Collected')}</span>
                  <span className="font-bold text-sage">{formatBDT(receivable.receivedAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-paper-mist2 pt-2">
                  <span className="font-semibold text-ink/80">{t('Remaining Balance')}</span>
                  <span className="font-bold text-blue-700 text-sm">
                    {formatBDT(
                      receivable.remaining ??
                        receivable.principal - receivable.receivedAmount
                    )}
                  </span>
                </div>

                <div className="h-2 bg-paper-mist rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-sage rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((receivable.receivedAmount / receivable.principal) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Details & Dates */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-paper-mist2">
                  <span className="text-ink/50">{t('Due Date')}</span>
                  {editingDueDate ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        className="input text-xs py-0.5 px-1.5"
                      />
                      <button
                        onClick={handleUpdateDueDate}
                        disabled={patchMutation.isPending}
                        className="btn-sage text-xs py-0.5 px-2"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingDueDate(false)}
                        className="btn-ghost text-xs py-0.5 px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 font-medium text-ink">
                      <span>
                        {receivable.dueDate
                          ? new Date(receivable.dueDate).toLocaleDateString(
                              i18n.language === 'bn' ? 'bn-BD' : 'en-US'
                            )
                          : t('None')}
                      </span>
                      {receivable.status === 'open' && (
                        <button
                          onClick={() => {
                            setNewDueDate(receivable.dueDate ? receivable.dueDate.slice(0, 10) : '');
                            setEditingDueDate(true);
                          }}
                          className="text-[10px] text-blue-600 hover:underline"
                        >
                          {t('edit')}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {receivable.note && (
                  <div className="py-1 border-b border-paper-mist2">
                    <span className="text-ink/50 block mb-0.5">{t('Note')}</span>
                    <p className="text-ink">{receivable.note}</p>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-paper-mist2">
                  <span className="text-ink/50">{t('Created')}</span>
                  <span className="text-ink/70">
                    {new Date(receivable.createdAt).toLocaleDateString(
                      i18n.language === 'bn' ? 'bn-BD' : 'en-US'
                    )}
                  </span>
                </div>
              </div>

              {/* Collections list */}
              <div>
                <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-ink/60 mb-3 flex items-center gap-1.5">
                  <FileText size={14} />
                  {t('Collection Installments')} ({receivable.payments?.length ?? 0})
                </h4>

                {!receivable.payments || receivable.payments.length === 0 ? (
                  <div className="p-4 rounded-lg bg-paper-mist/40 text-center text-xs text-ink/50">
                    {t('No collections recorded yet')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {receivable.payments.map((p) => (
                      <div
                        key={p._id}
                        className="p-3 rounded-lg border border-paper-mist2 bg-paper flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-ink">+{formatBDT(p.amount)}</p>
                          <p className="text-[11px] text-ink/45 capitalize">
                            {p.source} •{' '}
                            {new Date(p.date).toLocaleDateString(
                              i18n.language === 'bn' ? 'bn-BD' : 'en-US'
                            )}
                          </p>
                          {p.note && <p className="text-[11px] text-ink/60 mt-0.5">{p.note}</p>}
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-sage/15 text-sage font-medium">
                          {t('Received')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              {receivable.status === 'open' && receivable.receivedAmount === 0 && (
                <div className="pt-4 border-t border-paper-mist2">
                  <button
                    onClick={() => {
                      if (window.confirm(t('Are you sure you want to cancel this receivable?'))) {
                        cancelMutation.mutate(receivableId, {
                          onSuccess: () => onClose(),
                        });
                      }
                    }}
                    disabled={cancelMutation.isPending}
                    className="w-full btn-ghost text-xs text-red-600 hover:bg-red-50 py-2 border border-red-200 flex items-center justify-center gap-1.5"
                  >
                    <XCircle size={14} />
                    {t('Cancel Receivable')}
                  </button>
                </div>
              )}

              {receivable.status === 'cancelled' && (
                <div className="pt-4 border-t border-paper-mist2">
                  <button
                    onClick={() => {
                      if (window.confirm(t('Are you sure you want to delete this receivable?'))) {
                        deleteMutation.mutate(receivableId, {
                          onSuccess: () => onClose(),
                        });
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="w-full btn-ghost text-xs text-red-600 hover:bg-red-50 py-2 border border-red-200 flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    {t('Delete Receivable')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
