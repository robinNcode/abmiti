import { BudgetSummary } from '@/types';
import { formatBDT } from '@/utils';
import { useTranslation } from 'react-i18next';

export default function BudgetOverview({ summary }: { summary?: BudgetSummary }) {
  const { t } = useTranslation();
  const cards = [
    { label: t('planned'), value: summary?.totalPlanned ?? 0, color: 'text-sage' },
    { label: t('spent'), value: summary?.totalActual ?? 0, color: 'text-terra' },
    { label: t('remaining'), value: summary?.totalVariance ?? 0, color: (summary?.totalVariance ?? 0) >= 0 ? 'text-sage' : 'text-terra' },
    { label: t('allocated'), value: `${summary?.allocationPercent ?? 0}%`, color: (summary?.allocationPercent ?? 0) > 100 ? 'text-mustard' : 'text-ink' },
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
