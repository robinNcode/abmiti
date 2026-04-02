import { useCategoryBreakdown } from '@/hooks';
import { formatBDT } from '@/utils';
import { Spinner } from '@/components/ui';

export default function CategoryBreakdown() {
  const { data = [], isLoading } = useCategoryBreakdown();

  if (isLoading) return (
    <div className="flex justify-center py-8"><Spinner className="text-terra" /></div>
  );

  if (!data.length) return (
    <p className="text-xs text-ink/30 italic text-center py-6">No expenses this month</p>
  );

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={item.category._id}
          className="animate-fade-up"
          style={{ animationDelay: `${i * 40}ms` }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-base">{item.category.icon}</span>
              <span className="text-sm font-semibold">{item.category.name}</span>
              <span className="text-xs text-ink/35">({item.count})</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-terra">{formatBDT(item.total)}</span>
              <span className="text-xs text-ink/40 ml-1.5">{item.percentage}%</span>
            </div>
          </div>
          <div className="h-1.5 bg-paper-mist rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${item.percentage}%`,
                backgroundColor: item.category.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
