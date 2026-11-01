import { AlertTriangle } from 'lucide-react';
import { BudgetAnalysisResult, BudgetSummary } from '@/types';
import { formatBDT } from '@/utils';
import { useTranslation } from 'react-i18next';

export default function BudgetOverview({
  summary,
  analysis,
  onDrilldownUnbudgeted,
}: {
  summary?: BudgetSummary;
  analysis?: BudgetAnalysisResult;
  onDrilldownUnbudgeted?: () => void;
}) {
  const { t } = useTranslation();

  const plannedInc = analysis ? analysis.plannedIncome : (summary?.totalIncome ?? 0);
  const actualInc = analysis ? analysis.actualIncome : 0;
  const totalSpent = analysis ? analysis.totalSpent : (summary?.totalActual ?? 0);
  const netCashFlow = analysis ? analysis.netCashFlow : (plannedInc - totalSpent);
  const savingsRate = analysis?.savingsRate;

  const cards = [
    {
      label: t('Planned Income'),
      value: plannedInc,
      color: 'text-sage',
      sub: actualInc > 0 ? `${t('Actual')}: ${formatBDT(actualInc)}` : undefined,
    },
    {
      label: t('spent'),
      value: totalSpent,
      color: 'text-terra',
      sub: analysis && analysis.unbudgetedSpent > 0 ? `${t('Unbudgeted')}: ${formatBDT(analysis.unbudgetedSpent)}` : undefined,
    },
    {
      label: t('Net Cash Flow'),
      value: netCashFlow,
      color: netCashFlow >= 0 ? 'text-sage' : 'text-terra',
    },
    {
      label: t('Savings Rate'),
      value: savingsRate !== null && savingsRate !== undefined ? `${savingsRate}%` : `${summary?.allocationPercent ?? 0}%`,
      color: (savingsRate ?? 0) >= 20 ? 'text-sage' : 'text-mustard',
      sub: savingsRate !== null && savingsRate !== undefined ? t('of actual income') : t('allocated'),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">{card.label}</p>
            <p className={`font-display text-2xl font-black mt-2 ${card.color}`}>
              {typeof card.value === 'number' ? formatBDT(card.value) : card.value}
            </p>
            {card.sub && <p className="text-xs text-ink/40 mt-1">{card.sub}</p>}
          </div>
        ))}
      </div>

      {analysis && analysis.unbudgetedSpent > 0 && (
        <div className="card p-4 border border-mustard/30 bg-mustard/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-mustard/20 text-mustard flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">
                {t('Unbudgeted Outflows')}: <span className="text-mustard font-bold">{formatBDT(analysis.unbudgetedSpent)}</span>
              </p>
              <p className="text-xs text-ink/50">
                {t('{{count}} categories with spending are not mapped to any budget line', { count: analysis.unbudgetedEntriesCount })}
              </p>
            </div>
          </div>
          {onDrilldownUnbudgeted && (
            <button
              onClick={onDrilldownUnbudgeted}
              className="btn-ghost text-xs font-semibold text-mustard hover:bg-mustard/10 px-3 py-1.5 rounded-lg shrink-0"
            >
              {t('View Outflows')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
