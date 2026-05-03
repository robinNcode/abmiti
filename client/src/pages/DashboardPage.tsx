import { useState } from 'react';
import { useMonthlySummary, useEntries } from '@/hooks';
import { useMonthStore } from '@/store/monthStore';
import { SummaryCard, PageHeader, Modal, EmptyState, Spinner } from '@/components/ui';
import SmsEntryForm from '@/components/entry/SmsEntryForm';
import ExpenseForm from '@/components/entry/ExpenseForm';
import EntryRow from '@/components/entry/EntryRow';
import CategoryBreakdown from '@/components/charts/CategoryBreakdown';
import { formatBDT, monthLabel } from '@/utils';

type Tab = 'income' | 'expense';

export default function DashboardPage() {
  const [modal, setModal] = useState<Tab | null>(null);
  const { month, year } = useMonthStore();

  const { data: summary, isLoading: sumLoading } = useMonthlySummary();
  const { data: recentRes, isLoading: entriesLoading } = useEntries({ month, year, limit: 8 });
  const recent = recentRes?.data ?? [];

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

      <div className="px-8 space-y-6 pb-10">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {sumLoading ? (
            Array(3).fill(0).map((_, i) => (
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
                label="Savings" labelBn="মিতি" icon="◈" accent="savings"
                value={formatBDT(summary?.savings ?? 0)}
                sub={`${summary?.savingsRate ?? 0}% savings rate`}
              />
            </>
          )}
        </div>

        {/* Savings bar */}
        {summary && summary.income > 0 && (
          <div className="card p-5">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-semibold">Monthly Overview</p>
              <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-0.5 rounded-full">
                {summary.savingsRate}% saved
              </span>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Income', value: summary.income, max: summary.income, color: 'bg-sage' },
                { label: 'Expense', value: summary.expense, max: summary.income, color: 'bg-terra' },
                { label: 'Savings', value: Math.max(0, summary.savings), max: summary.income, color: 'bg-blue-500' },
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

        <div className="grid grid-cols-5 gap-4">
          {/* Recent entries */}
          <div className="col-span-3 card p-5">
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
          <div className="col-span-2 card p-5">
            <p className="font-display font-bold text-base mb-4">Expenses by Category</p>
            <CategoryBreakdown />
          </div>
        </div>
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
