import { Plus, Trash2 } from 'lucide-react';
import { BudgetSubItem } from '@/types';
import { useTranslation } from 'react-i18next';

export default function BudgetSubItemList({
  items,
  onChange,
}: {
  items: BudgetSubItem[];
  onChange: (items: BudgetSubItem[]) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="label">{t('Sub-items')}</p>
        <button
          type="button"
          onClick={() => onChange([...items, { name: '', expectedAmount: 0 }])}
          className="text-xs text-terra font-semibold flex items-center gap-1"
        >
          <Plus size={13} /> {t('add')}
        </button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="grid grid-cols-[1fr_110px_32px] gap-2">
          <input
            className="input"
            placeholder={t('name')}
            value={item.name}
            onChange={(event) => onChange(items.map((it, i) => i === index ? { ...it, name: event.target.value } : it))}
          />
          <input
            className="input"
            type="number"
            min={0}
            value={item.expectedAmount}
            onChange={(event) => onChange(items.map((it, i) => i === index ? { ...it, expectedAmount: Number(event.target.value) } : it))}
          />
          <button
            type="button"
            className="rounded-lg hover:bg-terra/10 text-terra flex items-center justify-center"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            aria-label={t('Remove sub-item')}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
