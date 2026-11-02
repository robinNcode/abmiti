import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMonthlySummary, useEntries, useBudget, useBudgetSummary, useNetPosition, useQuickExpenses } from '@/hooks';
import { useMonthStore } from '@/store/monthStore';
import { SummaryCard, PageHeader, Modal, EmptyState, Spinner } from '@/components/ui';
import SmsEntryForm from '@/components/entry/SmsEntryForm';
import ExpenseForm from '@/components/entry/ExpenseForm';
import QuickExpenseEditor from '@/components/entry/QuickExpenseEditor';
import EntryRow from '@/components/entry/EntryRow';
import { QuickExpenseItem } from '@/types';
import CategoryBreakdown from '@/components/charts/CategoryBreakdown';
import { formatBDT, formatBDTSigned, monthLabel } from '@/utils';
import { useTranslation } from 'react-i18next';

type Tab = 'income' | 'expense';

export default function DashboardPage() {
  const { t } = useTranslation();
  const [modal, setModal] = useState<Tab | null>(null);
  const [quickExpense, setQuickExpense] = useState<QuickExpenseItem | null>(null);
  const [showQuickEditor, setShowQuickEditor] = useState(false);
  const { month, year } = useMonthStore();

  const { data: summary, isLoading: sumLoading } = useMonthlySummary();
  const { data: recentRes, isLoading: entriesLoading } = useEntries({ month, year, limit: 8 });
  const { data: budget } = useBudget();
  const { data: budgetSummary } = useBudgetSummary(budget?._id);
  const { data: netPos } = useNetPosition();
  const { data: quickExpenseItems = [] } = useQuickExpenses();
  const recent = recentRes?.data ?? [];
  const healthLines = [...(budgetSummary?.lines ?? [])]
    .sort((a, b) => b.usedPercent - a.usedPercent)
    .slice(0, 3);

  // Monthly recurring expenses not yet recorded in the selected month.
  const pendingQuickItems = quickExpenseItems.filter((item) => !item.logged);
  const loggedQuickCount = quickExpenseItems.length - pendingQuickItems.length;

  return (
    <div className="min-h-full">
      <PageHeader
        title={monthLabel(month, year)}
        subtitle={t('Your financial overview')}
        action={
          <div className="flex gap-2">
            <button onClick={() => setModal('income')} className="btn-sage text-sm">↑ {t('income')}</button>
            <button onClick={() => setModal('expense')} className="btn-primary text-sm">↓ {t('expense')}</button>
          </div>
        }
      />

      <div className="px-4 md:px-8 space-y-4 md:space-y-6 pb-10">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summary && summary.budget > 0 && (
            <div className="card p-6 border-2 border-sage bg-sage/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">{t('Remaining Budget')}</p>
              <p className="font-display text-3xl font-black text-sage mt-3 tracking-tight">{formatBDT(summary.remainingBudget)}</p>
              <p className="text-xs text-ink/40 mt-2">{summary.budgetUsed}% {t('of budget used')}</p>
            </div>
          )}
          {summary && summary.income > 0 && (
            <div className="card p-6 border-2 border-blue-500 bg-blue-50/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">{t('Savings')}</p>
              <p className="font-display text-3xl font-black text-blue-600 mt-3 tracking-tight">{formatBDTSigned(summary.savings)}</p>
              <p className="text-xs text-ink/40 mt-2">{summary.savingsRate}% {t('savings rate')}</p>
            </div>
          )}
          {netPos && (
            <div className="card p-6 border-2 border-mustard/30 bg-mustard/5 relative group">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">
                  {t('Net Savings (Net Position)')}
                </p>
                <div
                  className="cursor-help text-xs bg-paper-mist px-1.5 py-0.5 rounded text-ink/50"
                  title={`${t('Formula')}: ৳${formatBDT(netPos.liquid)} (${t('Liquid')}) + ৳${formatBDT(netPos.receivableOpen)} (${t('Receivables')}) - ৳${formatBDT(netPos.payableOpen)} (${t('Payables')})`}
                >
                  ⓘ
                </div>
              </div>
              <p className={`font-display text-3xl font-black mt-3 tracking-tight ${netPos.netPosition >= 0 ? 'text-ink' : 'text-terra'}`}>
                {formatBDTSigned(netPos.netPosition)}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink/50 mt-2">
                <span>{t('Liquid')}: {formatBDT(netPos.liquid)}</span>
                <span>•</span>
                <span>{t('Receivables')}: {formatBDT(netPos.receivableOpen)}</span>
                <span>•</span>
                <span>{t('Payables')}: {formatBDT(netPos.payableOpen)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {sumLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="card p-5 h-28 animate-pulse bg-paper-mist" />
            ))
          ) : (
            <>
              <SummaryCard
                label={t('income')} labelBn="আয়" icon="↑" accent="income"
                value={formatBDT(summary?.income ?? 0)}
                sub={`${summary?.incomeCount ?? 0} ${t('entries')}`}
              />
              <SummaryCard
                label={t('expense')} labelBn="ব্যয়" icon="↓" accent="expense"
                value={formatBDT(summary?.expense ?? 0)}
                sub={`${summary?.expenseCount ?? 0} ${t('entries')}`}
              />
              <SummaryCard
                label={t('investment')} labelBn="বিনিয়োগ" icon="💼" accent="savings"
                value={formatBDT(summary?.investment ?? 0)}
                sub={`${summary?.investmentCount ?? 0} ${t('entries')}`}
              />
              <SummaryCard
                label={t('savings')} labelBn="মিতি" icon="◈" accent="savings"
                value={formatBDTSigned(summary?.savings ?? 0)}
                sub={`${summary?.savingsRate ?? 0}% ${t('savings rate')}`}
              />
            </>
          )}
        </div>

        {/* Quick Expense Entry Widget */}
        {(pendingQuickItems.length > 0 || loggedQuickCount > 0) && (
          <div className="card p-4 md:p-5 border border-paper-mist2 bg-gradient-to-r from-paper to-paper-mist/30">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 shrink-0 rounded-lg bg-terra/10 text-terra flex items-center justify-center font-bold text-sm">
                  ⚡
                </div>
                <div className="min-w-0">
                  <p className="font-display font-bold text-sm text-ink">{t('Quick Expense Entry')}</p>
                  <p className="text-xs text-ink/45 truncate">
                    {t('Tap a monthly expense to log it — it leaves the shortcuts once logged this month')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowQuickEditor(true)}
                  className="text-xs text-terra font-semibold hover:underline"
                >
                  ⚙ {t('Customize')}
                </button>
                <Link to="/budget" className="hidden sm:inline text-xs text-terra font-semibold hover:underline">
                  {t('Manage Budget →')}
                </Link>
              </div>
            </div>

            {pendingQuickItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {pendingQuickItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setQuickExpense(item);
                      setModal('expense');
                    }}
                    className="group relative flex flex-col items-start p-3 rounded-xl border border-paper-mist2 bg-paper hover:border-terra/40 hover:shadow-sm transition-all text-left"
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <span className="text-lg leading-none">{item.icon || '💸'}</span>
                      <span className="w-5 h-5 rounded-full bg-paper-mist2 group-hover:bg-terra group-hover:text-white flex items-center justify-center text-xs text-ink/60 transition-colors">
                        +
                      </span>
                    </div>
                    <p className="text-xs font-bold text-ink truncate w-full">{t(item.label)}</p>
                    <p className="text-[10px] text-ink/45 truncate w-full mt-0.5">
                      {(item.expectedAmount ?? 0) > 0 ? formatBDT(item.expectedAmount as number) : t('Pending')}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-sage flex items-center gap-1.5">
                ✓ {t('All monthly expenses are logged for this month')}
              </p>
            )}

            {loggedQuickCount > 0 && pendingQuickItems.length > 0 && (
              <p className="text-[11px] text-ink/45 mt-2">
                ✓ {loggedQuickCount} {t('logged this month')}
              </p>
            )}
          </div>
        )}

        {/* Monthly bars */}
        {summary && (summary.income > 0 || summary.budget > 0) && (
          <div className="card p-5">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-semibold">{t('Monthly Breakdown')}</p>
            </div>
            <div className="space-y-2.5">
              {[
                { label: t('budget'), value: summary.budget, max: Math.max(summary.income, summary.budget), color: 'bg-sage/70' },
                { label: t('expense'), value: summary.expense, max: Math.max(summary.income, summary.budget), color: 'bg-terra' },
                { label: t('investment'), value: summary.investment, max: Math.max(summary.income, summary.budget), color: 'bg-yellow-500' },
              ].map(({ label, value, max, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-ink/50">{label}</span>
                    <span className="font-semibold">{formatBDT(value)}</span>
                  </div>
                  <div className="h-2 bg-paper-mist rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${color}`}
                      style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Recent entries */}
          <div className="lg:col-span-3 card p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display font-bold text-base">{t('Recent Entries')}</p>
              <Link to="/entries" className="text-xs text-terra font-semibold hover:underline">{t('View all →')}</Link>
            </div>
            {entriesLoading ? (
              <div className="flex justify-center py-8"><Spinner className="text-terra" /></div>
            ) : recent.length ? (
              <div className="space-y-2">
                {recent.map((entry, i) => (
                  <EntryRow key={entry._id} entry={entry} style={{ animationDelay: `${i * 40}ms` }} />
                ))}
              </div>
            ) : (
              <EmptyState icon="📒" title={t('No entries yet')} subtitle={t('Add your first income or expense')} />
            )}
          </div>

          {/* Category breakdown */}
          <div className="lg:col-span-2 card p-4 md:p-5">
            <p className="font-display font-bold text-base mb-4">{t('Expenses by Category')}</p>
            <CategoryBreakdown />
          </div>
        </div>

        {budgetSummary && (
          <div className="card p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display font-bold text-base">{t('Budget Health')}</p>
              <Link to="/budget" className="text-xs text-terra font-semibold hover:underline">{t('Manage →')}</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {healthLines.map((line) => (
                <div key={line.lineId} className="rounded-lg border border-paper-mist2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm truncate">{line.icon} {line.name}</p>
                    <span className={line.status === 'over_budget' ? 'text-terra text-xs font-bold' : line.status === 'warning' ? 'text-mustard text-xs font-bold' : 'text-sage text-xs font-bold'}>
                      {line.usedPercent}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 bg-paper-mist rounded-full overflow-hidden">
                    <div
                      className={line.status === 'over_budget' ? 'h-full bg-terra' : line.status === 'warning' ? 'h-full bg-mustard' : 'h-full bg-sage'}
                      style={{ width: `${Math.min(100, line.usedPercent)}%` }}
                    />
                  </div>
                  <p className="text-xs text-ink/45 mt-2">{formatBDT(line.actualAmount)} of {formatBDT(line.plannedAmount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal open={modal === 'income'} onClose={() => setModal(null)} title={t('addIncomeTitle')}>
        <SmsEntryForm onSuccess={() => setModal(null)} />
      </Modal>
      <Modal
        open={modal === 'expense'}
        onClose={() => {
          setModal(null);
          setQuickExpense(null);
        }}
        title={quickExpense ? `${t('Quick Log')}: ${t(quickExpense.label)}` : t('addExpenseTitle')}
      >
        <ExpenseForm
          onSuccess={() => {
            setModal(null);
            setQuickExpense(null);
          }}
          type="expense"
          initialBudgetLineId={quickExpense?.budgetLineId ?? undefined}
          initialNote={quickExpense?.label}
          initialAmount={quickExpense?.expectedAmount && quickExpense.expectedAmount > 0 ? quickExpense.expectedAmount : undefined}
          initialCategoryId={quickExpense?.categoryId ?? undefined}
        />
      </Modal>

      <QuickExpenseEditor open={showQuickEditor} onClose={() => setShowQuickEditor(false)} />
    </div>
  );
}
