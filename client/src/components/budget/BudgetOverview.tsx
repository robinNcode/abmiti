import { BudgetSummary } from '@/types';
import { formatBDT } from '@/utils';

export default function BudgetOverview({ summary }: { summary?: BudgetSummary }) {
  const cards = [
    { label: 'Planned', value: summary?.totalPlanned ?? 0, color: 'text-sage' },
    { label: 'Spent', value: summary?.totalActual ?? 0, color: 'text-terra' },
    { label: 'Remaining', value: summary?.totalVariance ?? 0, color: (summary?.totalVariance ?? 0) >= 0 ? 'text-sage' : 'text-terra' },
    { label: 'Allocated', value: `${summary?.allocationPercent ?? 0}%`, color: (summary?.allocationPercent ?? 0) > 100 ? 'text-mustard' : 'text-ink' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">{card.label}</p>
          <p className={`font-display text-2xl font-black mt-2 ${card.color}`}>
            {typeof card.value === 'number' ? formatBDT(card.value) : card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
