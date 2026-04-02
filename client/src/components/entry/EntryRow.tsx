import { Trash2 } from 'lucide-react';
import { Entry } from '@/types';
import { useDeleteEntry } from '@/hooks';
import { formatDate, formatBDT, sourceBadgeClass, cx } from '@/utils';

interface Props { entry: Entry; style?: React.CSSProperties; }

export default function EntryRow({ entry, style }: Props) {
  const del = useDeleteEntry();

  return (
    <div style={style}
      className={cx(
        'flex items-center gap-3 px-4 py-3.5 rounded-xl border border-transparent',
        'bg-paper-mist hover:bg-white hover:border-paper-mist2 hover:shadow-card',
        'transition-all duration-200 group animate-fade-up',
        entry.type === 'income' ? 'border-l-2 border-l-sage' : 'border-l-2 border-l-terra',
      )}>

      {/* Icon */}
      <div className={cx(
        'w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0',
        entry.type === 'income' ? 'bg-sage/10' : 'bg-terra/10',
      )}>
        {entry.category?.icon ?? (entry.type === 'income' ? '💰' : '📦')}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{entry.note || entry.category?.name || '—'}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-ink/40">{formatDate(entry.date)}</span>
          <span className={cx('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', sourceBadgeClass[entry.source])}>
            {entry.source.toUpperCase()}
          </span>
          {entry.parsedFromSms && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-mustard/10 text-mustard">
              SMS
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className={cx(
          'font-display font-bold text-base',
          entry.type === 'income' ? 'text-sage' : 'text-terra',
        )}>
          {entry.type === 'income' ? '+' : '−'}{formatBDT(entry.amount)}
        </p>
        <p className="text-[10px] text-ink/35">{entry.category?.name}</p>
      </div>

      {/* Delete */}
      <button
        onClick={() => del.mutate(entry._id)}
        disabled={del.isPending}
        className="opacity-0 group-hover:opacity-100 ml-1 w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all text-ink/30 shrink-0">
        <Trash2 size={13} />
      </button>
    </div>
  );
}
