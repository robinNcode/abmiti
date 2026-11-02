import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui';
import { BudgetLine, BudgetLineSummary } from '@/types';
import { formatBDT } from '@/utils';

const normalize = (value: string) => value.trim().toLowerCase();

export default function BudgetSubItemsModal({
  open,
  onClose,
  line,
  summary,
}: {
  open: boolean;
  onClose: () => void;
  line?: BudgetLine;
  summary?: BudgetLineSummary;
}) {
  const { t } = useTranslation();

  const spentByName = new Map(
    (summary?.subItems ?? []).map((item) => [normalize(item.name), item.actualAmount]),
  );
  const subItems = line?.subItems ?? [];
  const totalExpected = subItems.reduce((sum, item) => sum + item.expectedAmount, 0);
  const totalSpent = subItems.reduce(
    (sum, item) => sum + (spentByName.get(normalize(item.name)) ?? 0),
    0,
  );

  return (
    <Modal open={open} onClose={onClose} title={line ? `${line.icon} ${line.name}` : t('Sub-items')}>
      {subItems.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink/45">{t('No sub-items yet.')}</p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 text-[10px] font-semibold uppercase tracking-wider text-ink/40">
            <span>{t('Sub-items')}</span>
            <span className="text-right">{t('Expected')}</span>
            <span className="w-24 text-right">{t('Spent')}</span>
          </div>

          <div className="divide-y divide-paper-mist">
            {subItems.map((item) => {
              const spent = spentByName.get(normalize(item.name)) ?? 0;
              const over = item.expectedAmount > 0 && spent > item.expectedAmount;
              return (
                <div
                  key={item._id ?? item.name}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-2.5 text-sm"
                >
                  <span className="truncate font-medium text-ink">{item.name}</span>
                  <span className="text-right text-ink/60">
                    {item.expectedAmount > 0 ? formatBDT(item.expectedAmount) : '—'}
                  </span>
                  <span className={`w-24 text-right font-display font-bold ${over ? 'text-terra' : 'text-ink'}`}>
                    {formatBDT(spent)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-t border-paper-mist2 pt-3 text-sm font-semibold">
            <span>{t('Total')}</span>
            <span className="text-right">{formatBDT(totalExpected)}</span>
            <span className="w-24 text-right font-display font-black text-terra">{formatBDT(totalSpent)}</span>
          </div>
        </div>
      )}
    </Modal>
  );
}
