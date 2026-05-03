import { useMonthlySummary } from '@/hooks';
import { useMonthStore } from '@/store/monthStore';
import { PageHeader, SummaryCard } from '@/components/ui';
import YearlyTrendChart from '@/components/charts/YearlyTrendChart';
import CategoryBreakdown from '@/components/charts/CategoryBreakdown';
import { formatBDT, monthLabel } from '@/utils';

export default function AnalyticsPage() {
  const { month, year } = useMonthStore();
  const { data: summary } = useMonthlySummary();

  return (
    <div className="min-h-full">
      <PageHeader
        title="Analytics — বিশ্লেষণ"
        subtitle={`Financial insights for ${year}`}
      />

      <div className="px-8 pb-10 space-y-6">
        {/* Monthly summary row */}
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label="Income" labelBn="আয়" icon="↑" accent="income"
            value={formatBDT(summary?.income ?? 0)}
            sub={`${monthLabel(month, year)}`} />
          <SummaryCard label="Expense" labelBn="ব্যয়" icon="↓" accent="expense"
            value={formatBDT(summary?.expense ?? 0)}
            sub={`${summary?.expenseCount ?? 0} transactions`} />
          <SummaryCard label="Savings" labelBn="মিতি" icon="◈" accent="savings"
            value={formatBDT(summary?.savings ?? 0)}
            sub={`${summary?.savingsRate ?? 0}% of income`} />
        </div>

        {/* Yearly trend chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-display font-bold text-lg">Yearly Trend — {year}</p>
              <p className="text-xs text-ink/45 mt-0.5">Income vs Expense vs Savings</p>
            </div>
          </div>
          <YearlyTrendChart />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Category breakdown */}
          <div className="card p-6">
            <p className="font-display font-bold text-base mb-5">
              Expense Categories — {monthLabel(month, year)}
            </p>
            <CategoryBreakdown />
          </div>

          {/* Savings health */}
          <div className="card p-6">
            <p className="font-display font-bold text-base mb-5">Savings Health</p>
            <div className="space-y-4">
              {summary ? (
                <>
                  <div className="text-center py-4">
                    <div className={`text-5xl font-display font-black ${summary.savingsRate >= 20 ? 'text-sage' :
                        summary.savingsRate >= 10 ? 'text-mustard' : 'text-terra'
                      }`}>
                      {summary.savingsRate}%
                    </div>
                    <p className="text-sm text-ink/50 mt-1">Monthly Savings Rate</p>
                  </div>

                  <div className="h-3 bg-paper-mist rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${summary.savingsRate >= 20 ? 'bg-sage' :
                          summary.savingsRate >= 10 ? 'bg-mustard' : 'bg-terra'
                        }`}
                      style={{ width: `${Math.min(100, summary.savingsRate)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
                    {[
                      { label: 'Poor', range: '< 10%', color: 'text-terra' },
                      { label: 'Good', range: '10–20%', color: 'text-mustard' },
                      { label: 'Great', range: '> 20%', color: 'text-sage' },
                    ].map(({ label, range, color }) => (
                      <div key={label} className="bg-paper-mist rounded-lg py-2">
                        <p className={`font-bold ${color}`}>{label}</p>
                        <p className="text-ink/40">{range}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-paper-mist rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-ink/50">Total Income</span>
                      <span className="font-semibold text-sage">{formatBDT(summary.income)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink/50">Total Expense</span>
                      <span className="font-semibold text-terra">{formatBDT(summary.expense)}</span>
                    </div>
                    <div className="flex justify-between border-t border-paper-mist2 pt-2 mt-2">
                      <span className="text-ink/50">Net Savings</span>
                      <span className={`font-bold ${summary.savings >= 0 ? 'text-blue-600' : 'text-terra'}`}>
                        {formatBDT(summary.savings)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-ink/40 italic text-center py-6">No data for this month</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
