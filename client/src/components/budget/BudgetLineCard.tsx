import { Edit2, Trash2 } from 'lucide-react';
import { BudgetLine, BudgetLineSummary } from '@/types';
import { formatBDT } from '@/utils';

const barColor = (status?: string) => (
  status === 'over_budget' ? 'bg-terra' : status === 'warning' ? 'bg-mustard' : 'bg-sage'
);

export default function BudgetLineCard({
  line,
  summary,
  onEdit,
  onDelete,
}: {
  line: BudgetLine;
  summary?: BudgetLineSummary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const used = Math.min(100, summary?.usedPercent ?? 0);

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
          <button onClick={onEdit} className="w-8 h-8 rounded-lg hover:bg-paper-mist flex items-center justify-center" aria-label="Edit budget line">
            <Edit2 size={15} />
          </button>
          <button onClick={onDelete} className="w-8 h-8 rounded-lg hover:bg-terra/10 text-terra flex items-center justify-center" aria-label="Delete budget line">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <div><p className="text-ink/40">Planned</p><p className="font-semibold">{formatBDT(summary?.plannedAmount ?? 0)}</p></div>
        <div><p className="text-ink/40">Actual</p><p className="font-semibold">{formatBDT(summary?.actualAmount ?? 0)}</p></div>
        <div><p className="text-ink/40">Variance</p><p className={(summary?.variance ?? 0) >= 0 ? 'font-semibold text-sage' : 'font-semibold text-terra'}>{formatBDT(summary?.variance ?? 0)}</p></div>
      </div>

      <div className="mt-3 h-2 bg-paper-mist rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor(summary?.status)}`} style={{ width: `${used}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-ink/45">
        <span>{summary?.usedPercent ?? 0}% used</span>
        {line.subItems.length > 0 && <span>{line.subItems.length} sub-items</span>}
      </div>
    </div>
  );
}
