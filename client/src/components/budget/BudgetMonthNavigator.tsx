import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMonthStore } from '@/store/monthStore';
import { monthLabel } from '@/utils';
import { useTranslation } from 'react-i18next';

export default function BudgetMonthNavigator() {
  const { month, year, prev, next } = useMonthStore();
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <button onClick={prev} className="w-9 h-9 rounded-lg border border-paper-mist2 hover:bg-paper-mist flex items-center justify-center" aria-label={t('Previous month')}>
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm font-semibold min-w-[120px] text-center">{monthLabel(month, year)}</span>
      <button onClick={next} className="w-9 h-9 rounded-lg border border-paper-mist2 hover:bg-paper-mist flex items-center justify-center" aria-label={t('Next month')}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
