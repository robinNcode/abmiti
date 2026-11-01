import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Modal, Spinner } from '@/components/ui';
import { useBudgetDrilldown } from '@/hooks';
import { formatBDT } from '@/utils';

export default function BudgetDrilldownModal({
  open,
  onClose,
  title,
  budgetId,
  lineId,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  budgetId?: string;
  lineId?: string;
}) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useBudgetDrilldown(
    open && budgetId ? budgetId : undefined,
    { lineId, page, limit: 10 },
  );

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Spinner className="text-terra" />
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="py-8 text-center text-ink/45 text-sm flex flex-col items-center gap-2">
            <FileText size={24} className="opacity-40" />
            <p>{t('No transactions recorded for this period.')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="divide-y divide-paper-mist max-h-80 overflow-y-auto pr-1">
              {data.data.map((entry) => (
                <div key={entry._id} className="py-2.5 flex items-center justify-between text-sm">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-ink truncate">
                      {entry.category?.name || t('Uncategorized')}
                    </p>
                    <p className="text-xs text-ink/45 truncate">
                      {new Date(entry.date).toLocaleDateString()} {entry.note ? `• ${entry.note}` : ''}
                    </p>
                  </div>
                  <span className="font-display font-bold text-terra shrink-0">
                    {formatBDT(entry.amount)}
                  </span>
                </div>
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-paper-mist text-xs text-ink/60">
                <span>
                  {t('Page {{page}} of {{total}}', { page: data.page, total: data.totalPages })}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={data.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded hover:bg-paper-mist disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={data.page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-1.5 rounded hover:bg-paper-mist disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
