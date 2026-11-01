import { Edit2, ListFilter, Trash2 } from 'lucide-react';
import { BudgetLine, BudgetLineSummary, ComputedLineSummary } from '@/types';
import { formatBDT } from '@/utils';
import { useTranslation } from 'react-i18next';

const barColor = (status?: string) => {
  if (status === 'over' || status === 'over_budget') return 'bg-terra';
  if (status === 'warn' || status === 'warning') return 'bg-mustard';
  return 'bg-sage';
};

export default function BudgetLineCard({
  line,
  summary,
  computedLine,
  onEdit,
  onDelete,
  onViewEntries,
}: {
  line: BudgetLine;
  summary?: BudgetLineSummary;
  computedLine?: ComputedLineSummary;
  onEdit: () => void;
  onDelete: () => void;
  onViewEntries?: () => void;
}) {
  const { t } = useTranslation();

  const planned = computedLine ? computedLine.allocated : (summary?.plannedAmount ?? 0);
  const spent = computedLine ? computedLine.spent : (summary?.actualAmount ?? 0);
  const remaining = computedLine ? computedLine.remaining : (summary?.variance ?? 0);
  const usedPercent = computedLine ? computedLine.pctUsed : (summary?.usedPercent ?? 0);
  const status = computedLine ? computedLine.status : summary?.status;
  const used = Math.min(100, usedPercent);

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: `${line.color}18` }}>
            {line.icon}
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold truncate">{line.name}</p>
            <p className="text-xs text-ink/45">
              {line.allocationMethod === 'percentage' ? `${line.allocationValue}%` : formatBDT(line.allocationValue)}
            </p>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {onViewEntries && (
            <button
              onClick={onViewEntries}
              className="w-8 h-8 rounded-lg hover:bg-paper-mist flex items-center justify-center text-ink/60 hover:text-ink"
              aria-label={t('View line entries')}
              title={t('View line entries')}
            >
              <ListFilter size={15} />
            </button>
          )}
          <button onClick={onEdit} className="w-8 h-8 rounded-lg hover:bg-paper-mist flex items-center justify-center" aria-label={t('Edit budget line')}>
            <Edit2 size={15} />
          </button>
          <button onClick={onDelete} className="w-8 h-8 rounded-lg hover:bg-terra/10 text-terra flex items-center justify-center" aria-label={t('Delete budget line')}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <div><p className="text-ink/40">{t('planned')}</p><p className="font-semibold">{formatBDT(planned)}</p></div>
        <div><p className="text-ink/40">{t('Actual')}</p><p className="font-semibold">{formatBDT(spent)}</p></div>
        <div><p className="text-ink/40">{t('Variance')}</p><p className={remaining >= 0 ? 'font-semibold text-sage' : 'font-semibold text-terra'}>{formatBDT(remaining)}</p></div>
      </div>

      <div className="mt-3 h-2 bg-paper-mist rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor(status)}`} style={{ width: `${used}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-ink/45">
        <span className={status === 'over' ? 'text-terra font-semibold' : status === 'warn' ? 'text-mustard font-semibold' : ''}>
          {usedPercent}% {t('used')}
        </span>
        {line.subItems && line.subItems.length > 0 && <span>{line.subItems.length} {t('sub-items')}</span>}
      </div>
    </div>
  );
}
