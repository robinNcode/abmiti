import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  useCreateEntry,
  useCategories,
  useAccounts,
  useCreateCategory,
  useBudget,
  useBudgetMutations,
} from '@/hooks';
import { PaymentSource, EntryType } from '@/types';
import { Spinner, Modal } from '@/components/ui';
import { sourceLabel, cx, categoryTypeForEntry, formatBDT } from '@/utils';
import { useTranslation } from 'react-i18next';

interface Props {
  onSuccess?: () => void;
  type?: EntryType;
  initialBudgetLineId?: string;
  initialAmount?: string | number;
  initialNote?: string;
  initialCategoryId?: string;
}

export default function ExpenseForm({
  onSuccess,
  type = 'expense',
  initialBudgetLineId,
  initialAmount,
  initialNote,
  initialCategoryId,
}: Props) {
  const { t } = useTranslation();
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🏷️');
  const [newCatColor, setNewCatColor] = useState('#BF6046');
  const [showAllCategories, setShowAllCategories] = useState(false);

  const { data: budget } = useBudget();
  const budgetMutations = useBudgetMutations();

  const [selectedLineId, setSelectedLineId] = useState<string | null>(
    initialBudgetLineId ?? null,
  );

  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      amount: initialAmount !== undefined ? String(initialAmount) : '',
      note: initialNote ?? '',
      categoryId: initialCategoryId ?? '',
      sector: '',
      accountId: '',
      source: 'cash' as PaymentSource,
      date: new Date().toISOString().split('T')[0],
    },
  });

  const createEntry = useCreateEntry();
  const createCategory = useCreateCategory();
  const categoryType = categoryTypeForEntry(type);
  const { data: categories = [] } = useCategories(categoryType);
  const { data: accounts = [] } = useAccounts();
  const selectedCat = watch('categoryId');

  const selectedLine = useMemo(() => {
    if (!budget?.lines || !selectedLineId) return null;
    return budget.lines.find((l) => l._id === selectedLineId) || null;
  }, [budget?.lines, selectedLineId]);

  useEffect(() => {
    if (initialBudgetLineId) {
      setSelectedLineId(initialBudgetLineId);
    }
  }, [initialBudgetLineId]);

  // When selectedLine changes, auto-select its first linked category if not yet set
  useEffect(() => {
    if (selectedLine && selectedLine.linkedCategoryIds.length > 0) {
      if (!watch('categoryId') || !selectedLine.linkedCategoryIds.includes(watch('categoryId'))) {
        setValue('categoryId', selectedLine.linkedCategoryIds[0]);
      }
    }
  }, [selectedLine, setValue, watch]);

  const displayCategories = useMemo(() => {
    if (!selectedLine || showAllCategories || selectedLine.linkedCategoryIds.length === 0) {
      return categories;
    }
    const linkedSet = new Set(selectedLine.linkedCategoryIds);
    const filtered = categories.filter((c) => linkedSet.has(c._id));
    return filtered.length > 0 ? filtered : categories;
  }, [categories, selectedLine, showAllCategories]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newCatName.trim()) return;
    try {
      const newCat = await createCategory.mutateAsync({
        name: newCatName.trim(),
        icon: newCatIcon,
        color: newCatColor,
        type: categoryType,
      });
      setValue('categoryId', newCat._id);

      // Auto-link newly created category to selected budget line if active
      if (budget && selectedLine) {
        const currentLinked = selectedLine.linkedCategoryIds ?? [];
        if (!currentLinked.includes(newCat._id)) {
          budgetMutations.updateLine.mutate({
            id: budget._id,
            lineId: selectedLine._id,
            line: {
              linkedCategoryIds: [...currentLinked, newCat._id],
            },
          });
        }
      }

      setShowAddCat(false);
      setNewCatName('');
    } catch (err) {
      // toast is already handled by hook
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    const chosenCatId = data.categoryId || categories[0]?._id;

    // If a budget line is selected but has no linked categories yet, link this category
    if (budget && selectedLine && chosenCatId) {
      const currentLinked = selectedLine.linkedCategoryIds ?? [];
      if (!currentLinked.includes(chosenCatId)) {
        budgetMutations.updateLine.mutate({
          id: budget._id,
          lineId: selectedLine._id,
          line: {
            linkedCategoryIds: [...currentLinked, chosenCatId],
          },
        });
      }
    }

    await createEntry.mutateAsync({
      type,
      amount: parseFloat(data.amount),
      note: data.note,
      categoryId: chosenCatId,
      sector: data.sector,
      source: data.source,
      date: data.date,
      accountId: data.accountId,
    });
    reset({
      amount: '',
      note: '',
      categoryId: '',
      accountId: '',
      source: 'cash',
      date: new Date().toISOString().split('T')[0],
    });
    onSuccess?.();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {/* Budget Line Selector & Sub-items (for expense type) */}
      {budget && budget.lines.length > 0 && type === 'expense' && (
        <div className="space-y-2 pb-2.5 border-b border-paper-mist">
          <div className="flex items-center justify-between">
            <label className="label mb-0">{t('Budget Line')}</label>
            {selectedLine && (
              <span className="text-xs font-semibold text-sage">
                {selectedLine.icon} {selectedLine.name}
              </span>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedLineId(null)}
              className={cx(
                'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border',
                !selectedLineId
                  ? 'bg-ink text-white border-ink'
                  : 'border-paper-mist2 bg-paper-mist text-ink/60 hover:text-ink',
              )}
            >
              {t('All')}
            </button>
            {budget.lines
              .filter((l) => l.isActive)
              .map((l) => (
                <button
                  key={l._id}
                  type="button"
                  onClick={() => {
                    setSelectedLineId(l._id);
                    if (l.linkedCategoryIds.length > 0) {
                      setValue('categoryId', l.linkedCategoryIds[0]);
                    }
                  }}
                  className={cx(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border',
                    selectedLineId === l._id
                      ? 'bg-terra text-white border-terra shadow-sm'
                      : 'border-paper-mist2 bg-paper-mist text-ink/70 hover:border-terra/30',
                  )}
                >
                  <span>{l.icon}</span>
                  <span>{l.name}</span>
                </button>
              ))}
          </div>

          {/* Quick Sub-items row */}
          {selectedLine && (selectedLine.subItems?.length ?? 0) > 0 && (
            <div className="pt-1">
              <p className="text-[10px] font-semibold text-ink/40 uppercase tracking-wider mb-1">
                {t('Budget Sub-items')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedLine.subItems.map((sub) => (
                  <button
                    key={sub.name}
                    type="button"
                    onClick={() => {
                      setValue('note', sub.name);
                      if (sub.expectedAmount > 0) {
                        setValue('amount', String(sub.expectedAmount));
                      }
                    }}
                    className="text-xs px-2.5 py-1 rounded-md bg-paper-mist2/60 hover:bg-paper-mist2 text-ink/80 hover:text-ink font-medium border border-paper-mist2 transition-all flex items-center gap-1"
                  >
                    <span>{sub.name}</span>
                    {sub.expectedAmount > 0 && (
                      <span className="text-[10px] text-ink/50">({formatBDT(sub.expectedAmount)})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category grid */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="label mb-0">{t('category')}</label>
          {selectedLine && selectedLine.linkedCategoryIds.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAllCategories((v) => !v)}
              className="text-[11px] text-terra font-semibold hover:underline"
            >
              {showAllCategories ? t('Show line categories') : t('Show all categories')}
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {displayCategories.map((cat) => (
            <button key={cat._id} type="button"
              onClick={() => setValue('categoryId', cat._id)}
              className={cx(
                'flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-xs font-semibold transition-all duration-150',
                selectedCat === cat._id
                  ? 'bg-terra text-white border-terra shadow-sm scale-95'
                  : 'border-paper-mist2 bg-paper-mist hover:border-terra/40 text-ink/70',
              )}>
              <span className="text-lg leading-none">{cat.icon}</span>
              <span className="truncate w-full text-center text-[10px]">{cat.name}</span>
            </button>
          ))}
          <button type="button"
            onClick={() => setShowAddCat(true)}
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl border border-dashed border-paper-mist2 bg-paper-mist hover:border-terra/40 text-ink/70 text-xs font-semibold transition-all duration-150">
            <span className="text-lg leading-none">＋</span>
            <span className="truncate w-full text-center text-[10px]">{t('Add New')}</span>
          </button>
        </div>

        <Modal open={showAddCat} onClose={() => setShowAddCat(false)} title={t('Create New Category')}>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="label">{t('Category Name')}</label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder={t('e.g. Subscriptions, Gifts')}
                className="input"
              />
            </div>
            
            <div>
              <label className="label">{t('Select Icon')}</label>
              <div className="grid grid-cols-6 gap-2">
                {['🏷️', '🍔', '🚗', '🏠', '🎮', '🏥', '🎓', '✈️', '🛒', '💰', '📈', '🎁'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewCatIcon(emoji)}
                    className={cx(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-xl border transition-all",
                      newCatIcon === emoji ? "border-terra bg-terra/10 shadow-sm" : "border-paper-mist2 hover:bg-paper-mist"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">{t('Select Color')}</label>
              <div className="flex flex-wrap gap-2">
                {['#BF6046', '#2E7D32', '#1565C0', '#E65100', '#6A1B9A', '#F57F17', '#37474F'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCatColor(color)}
                    className={cx(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      newCatColor === color ? "border-ink scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={createCategory.isPending}
              className={cx('btn-primary w-full mt-2', createCategory.isPending && 'opacity-70')}
            >
              {createCategory.isPending ? <Spinner /> : t('createCategory')}
            </button>
          </form>
        </Modal>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t('Amount (BDT) *')}</label>
          <input {...register('amount', { required: true })} type="number" step="0.01" min="0.01"
            placeholder="0" className="input" />
        </div>
        <div>
          <label className="label">{t('date')}</label>
          <input {...register('date')} type="date" className="input" />
        </div>
      </div>

      <div>
        <label className="label">{t('Description')}</label>
        <input {...register('note')} placeholder={t('House rent, groceries...')} className="input" />
      </div>

      {type === 'investment' && (
        <div>
          <label className="label">{t('Sector')}</label>
          <input {...register('sector')} placeholder={t('Stock, Real estate, Crypto...')} className="input" />
        </div>
      )}

      <div>
        <label className="label">{t('Paid Via')}</label>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.entries(sourceLabel) as [PaymentSource, string][]).slice(0, 6).map(([v, l]) => (
            <button key={v} type="button"
              onClick={() => setValue('source', v)}
              className={cx(
                'py-2 px-1 rounded-lg border text-xs font-medium transition-all',
                watch('source') === v
                  ? 'bg-ink text-white border-ink'
                  : 'border-paper-mist2 hover:bg-paper-mist text-ink/60',
              )}>
              {l.split(' ').slice(0, 1).join(' ')} {t(v)}
            </button>
          ))}
        </div>
      </div>

      {/* Account selection - only for savings type */}
      {type === 'savings' && (
        <div>
          <label className="label">{t('account')}</label>
          <select {...register('accountId')} className="input">
            <option value="">{accounts.length ? t('— Select account —') : t('No accounts available')}</option>
            {accounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                {acc.name} ({acc.balance} BDT)
              </option>
            ))}
          </select>
        </div>
      )}

      <button type="submit" disabled={createEntry.isPending}
        className={cx('btn-primary w-full mt-1', createEntry.isPending && 'opacity-70')}>
        {createEntry.isPending ? <Spinner /> : 
          type === 'expense' ? `− ${t('addExpense')}` :
          type === 'savings' ? `💰 ${t('addSavings')}` :
          type === 'payable' ? `📤 ${t('addPayable')}` :
          type === 'receivable' ? `📥 ${t('addReceivable')}` :
          `− ${t('add')}`
        }
      </button>
    </form>
  );
}
