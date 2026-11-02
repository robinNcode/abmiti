import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBudget, useCategories, useQuickExpenses, useReplaceQuickExpenses } from '@/hooks';
import { Modal, Spinner } from '@/components/ui';
import { QuickExpenseInput } from '@/types';
import { cx, formatBDT } from '@/utils';

const MAX_QUICK_EXPENSES = 6;

interface Candidate {
  key: string;
  input: QuickExpenseInput;
  group: 'budget' | 'category';
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const nameKey = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

const toInput = (label: string): QuickExpenseInput => ({
  label,
  icon: '💸',
  categoryId: null,
  budgetLineId: null,
  expectedAmount: 0,
});

/**
 * Pins up to six recurring expenses to the dashboard. Items can come from budget
 * sub-items or from the user's own expense categories.
 */
export default function QuickExpenseEditor({ open, onClose }: Props) {
  const { t } = useTranslation();
  const { data: budget } = useBudget();
  const { data: categories = [] } = useCategories('expense');
  const { data: current = [] } = useQuickExpenses();
  const replace = useReplaceQuickExpenses();

  const [selected, setSelected] = useState<QuickExpenseInput[]>([]);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setSelected(
        current.map((item) => ({
          label:       item.label,
          icon:        item.icon ?? '💸',
          categoryId:  item.categoryId ?? null,
          budgetLineId: item.budgetLineId ?? null,
          expectedAmount: item.expectedAmount ?? 0,
        })),
      );
    }
    wasOpen.current = open;
  }, [open, current]);

  const candidates = useMemo<Candidate[]>(() => {
    const list: Candidate[] = [];

    for (const line of budget?.lines?.filter((l) => l.isActive) ?? []) {
      for (const sub of line.subItems ?? []) {
        list.push({
          key: `sub:${line._id}:${sub.name}`,
          group: 'budget',
          input: {
            label:       sub.name,
            icon:        line.icon || '💸',
            categoryId:  line.linkedCategoryIds[0] ?? null,
            budgetLineId: line._id,
            expectedAmount: sub.expectedAmount,
          },
        });
      }
    }

    const usedNames = new Set(list.map((c) => nameKey(c.input.label)));
    for (const cat of categories) {
      if (usedNames.has(nameKey(cat.name))) continue;
      list.push({
        key: `cat:${cat._id}`,
        group: 'category',
        input: { label: cat.name, icon: cat.icon, categoryId: cat._id, budgetLineId: null, expectedAmount: 0 },
      });
    }

    return list;
  }, [budget, categories]);

  const isSelected = (input: QuickExpenseInput) =>
    selected.some((item) => nameKey(item.label) === nameKey(input.label));

  const full = selected.length >= MAX_QUICK_EXPENSES;

  const toggle = (input: QuickExpenseInput) => {
    setSelected((prev) => {
      if (prev.some((item) => nameKey(item.label) === nameKey(input.label))) {
        return prev.filter((item) => nameKey(item.label) !== nameKey(input.label));
      }
      if (prev.length >= MAX_QUICK_EXPENSES) return prev;
      return [...prev, { ...input, label: input.label.trim() }];
    });
  };

  const addCustom = () => {
    const label = window.prompt(t('Expense name'))?.trim();
    if (!label) return;
    if (selected.some((item) => nameKey(item.label) === nameKey(label))) return;
    if (selected.length >= MAX_QUICK_EXPENSES) return;
    setSelected((prev) => [...prev, toInput(label.slice(0, 100))]);
  };

  const save = () => {
    replace.mutate(selected, { onSuccess: onClose });
  };

  const groups: { id: Candidate['group']; title: string }[] = [
    { id: 'budget', title: t('From budget sub-items') },
    { id: 'category', title: t('Expense categories') },
  ];

  return (
    <Modal open={open} onClose={onClose} title={t('Quick Expenses')}>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">
              {t('Selected')} {selected.length}/{MAX_QUICK_EXPENSES}
            </p>
            <button
              type="button"
              onClick={addCustom}
              disabled={full}
              className={cx('text-xs font-semibold text-terra hover:underline', full && 'opacity-40 pointer-events-none')}
            >
              + {t('Custom expense')}
            </button>
          </div>

          {selected.length === 0 ? (
            <p className="text-xs text-ink/45">{t('Pick up to 6 monthly expenses for the dashboard')}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((item) => (
                <button
                  key={nameKey(item.label)}
                  type="button"
                  onClick={() => toggle(item)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-terra/10 border border-terra/30 text-xs font-semibold text-terra"
                >
                  <span>{item.icon || '💸'}</span>
                  <span className="truncate max-w-[9rem]">{item.label}</span>
                  <span className="text-terra/60">×</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {groups.map(({ id, title }) => {
          const items = candidates.filter((c) => c.group === id);
          if (items.length === 0) return null;
          return (
            <div key={id}>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/45 mb-2">{title}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {items.map(({ key, input }) => {
                  const active = isSelected(input);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggle(input)}
                      disabled={!active && full}
                      className={cx(
                        'flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-xs font-medium text-left transition-all',
                        active
                          ? 'border-terra bg-terra/10 text-terra'
                          : 'border-paper-mist2 bg-paper-mist text-ink/70 hover:border-terra/40',
                        !active && full && 'opacity-40',
                      )}
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span>{input.icon || '💸'}</span>
                        <span className="truncate">{t(input.label)}</span>
                      </span>
                      <span className="shrink-0 text-[10px] text-ink/45">
                        {active ? '✓' : (input.expectedAmount ?? 0) > 0 ? formatBDT(input.expectedAmount as number) : '+'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 text-sm">
            {t('Cancel')}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={replace.isPending}
            className={cx('btn-primary flex-1 text-sm', replace.isPending && 'opacity-70')}
          >
            {replace.isPending ? <Spinner /> : t('Save quick expenses')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
