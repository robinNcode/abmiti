import { useState } from 'react';
import { useMonthlySummary, useEntries, useBudget, useBudgetSummary } from '@/hooks';
import { useMonthStore } from '@/store/monthStore';
import { SummaryCard, PageHeader, Modal, EmptyState, Spinner } from '@/components/ui';
import SmsEntryForm from '@/components/entry/SmsEntryForm';
import ExpenseForm from '@/components/entry/ExpenseForm';
import EntryRow from '@/components/entry/EntryRow';
import CategoryBreakdown from '@/components/charts/CategoryBreakdown';
import { formatBDT, formatBDTSigned, monthLabel } from '@/utils';

type Tab = 'income' | 'expense';

export default function DashboardPage() {
  const [modal, setModal] = useState<Tab | null>(null);
  const { month, year } = useMonthStore();

  const { data: summary, isLoading: sumLoading } = useMonthlySummary();
  const { data: recentRes, isLoading: entriesLoading } = useEntries({ month, year, limit: 8 });
  const { data: budget } = useBudget();
  const { data: budgetSummary } = useBudgetSummary(budget?._id);
  const recent = recentRes?.data ?? [];
  const healthLines = [...(budgetSummary?.lines ?? [])]
    .sort((a, b) => b.usedPercent - a.usedPercent)
    .slice(0, 3);

  return (
    <div className="min-h-full">
      <PageHeader
        title={monthLabel(month, year)}
        subtitle="Your financial overview"
        action={
          <div className="flex gap-2">
            <button onClick={() => setModal('income')} className="btn-sage text-sm">↑ Income</button>
            <button onClick={() => setModal('expense')} className="btn-primary text-sm">↓ Expense</button>
          </div>
        }
      />

      <div className="px-4 md:px-8 space-y-4 md:space-y-6 pb-10">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4">
          {summary && summary.budget > 0 && (
            <div className="card p-6 border-2 border-sage bg-sage/5 col-span-2 md:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">Remaining Budget</p>
              <p className="font-display text-4xl font-black text-sage mt-3 tracking-tight">{formatBDT(summary.remainingBudget)}</p>
              <p className="text-xs text-ink/40 mt-2">{summary.budgetUsed}% of budget used</p>
            </div>
          )}
          {summary && summary.income > 0 && (
            <div className="card p-6 border-2 border-blue-500 bg-blue-50/50 col-span-2 md:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">Savings</p>
              <p className="font-display text-4xl font-black text-blue-600 mt-3 tracking-tight">{formatBDTSigned(summary.savings)}</p>
              <p className="text-xs text-ink/40 mt-2">{summary.savingsRate}% savings rate</p>
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
                label="Income" labelBn="আয়" icon="↑" accent="income"
                value={formatBDT(summary?.income ?? 0)}
                sub={`${summary?.incomeCount ?? 0} entries`}
              />
              <SummaryCard
                label="Expense" labelBn="ব্যয়" icon="↓" accent="expense"
                value={formatBDT(summary?.expense ?? 0)}
                sub={`${summary?.expenseCount ?? 0} entries`}
              />
              <SummaryCard
                label="Investment" labelBn="বিনিয়োগ" icon="💼" accent="savings"
                value={formatBDT(summary?.investment ?? 0)}
                sub={`${summary?.investmentCount ?? 0} entries`}
              />
              <SummaryCard
                label="Savings" labelBn="মিতি" icon="◈" accent="savings"
                value={formatBDTSigned(summary?.savings ?? 0)}
                sub={`${summary?.savingsRate ?? 0}% savings rate`}
              />
            </>
          )}
        </div>

        {/* Monthly bars */}
        {summary && (summary.income > 0 || summary.budget > 0) && (
          <div className="card p-5">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-semibold">Monthly Breakdown</p>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Budget',     value: summary.budget,          max: Math.max(summary.income, summary.budget), color: 'bg-sage/70' },
                { label: 'Expense',   value: summary.expense,         max: Math.max(summary.income, summary.budget), color: 'bg-terra' },
                { label: 'Investment', value: summary.investment,      max: Math.max(summary.income, summary.budget), color: 'bg-yellow-500' },
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
              <p className="font-display font-bold text-base">Recent Entries</p>
              <a href="/entries" className="text-xs text-terra font-semibold hover:underline">View all →</a>
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
              <EmptyState icon="📒" title="No entries yet" subtitle="Add your first income or expense" />
            )}
          </div>

          {/* Category breakdown */}
          <div className="lg:col-span-2 card p-4 md:p-5">
            <p className="font-display font-bold text-base mb-4">Expenses by Category</p>
            <CategoryBreakdown />
          </div>
        </div>

        {budgetSummary && (
          <div className="card p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display font-bold text-base">Budget Health</p>
              <a href="/budget" className="text-xs text-terra font-semibold hover:underline">Manage →</a>
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
      <Modal open={modal === 'income'} onClose={() => setModal(null)} title="Add Income — আয়">
        <SmsEntryForm onSuccess={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'expense'} onClose={() => setModal(null)} title="Add Expense — ব্যয়">
        <ExpenseForm onSuccess={() => setModal(null)} />
      </Modal>
    </div>
  );
}
