import { useMemo, useState } from 'react';
import { BudgetLine, BudgetLineInput, Category } from '@/types';
import BudgetSubItemList from './BudgetSubItemList';

const emptyLine: BudgetLineInput = {
  name: '',
  icon: '📦',
  color: '#4A7C59',
  allocationMethod: 'percentage',
  allocationValue: 0,
  linkedCategoryIds: [],
  subItems: [],
  order: 0,
  isActive: true,
  note: '',
};

export default function BudgetLineForm({
  line,
  categories,
  onSubmit,
  onCancel,
}: {
  line?: BudgetLine;
  categories: Category[];
  onSubmit: (line: BudgetLineInput) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<BudgetLineInput>(line ? {
    name: line.name,
    icon: line.icon,
    color: line.color,
    allocationMethod: line.allocationMethod,
    allocationValue: line.allocationValue,
    linkedCategoryIds: line.linkedCategoryIds,
    subItems: line.subItems,
    order: line.order,
    isActive: line.isActive,
    note: line.note ?? '',
  } : emptyLine);

  const selected = useMemo(() => new Set(form.linkedCategoryIds), [form.linkedCategoryIds]);

  const toggleCategory = (id: string) => {
    setForm((current) => ({
      ...current,
      linkedCategoryIds: selected.has(id)
        ? current.linkedCategoryIds.filter((catId) => catId !== id)
        : [...current.linkedCategoryIds, id],
    }));
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}
    >
      <div className="grid grid-cols-[70px_1fr] gap-3">
        <div>
          <label className="label">Icon</label>
          <input className="input text-center" value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} />
        </div>
        <div>
          <label className="label">Name</label>
          <input className="input" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Allocation</label>
          <select className="input" value={form.allocationMethod} onChange={(event) => setForm({ ...form, allocationMethod: event.target.value as BudgetLineInput['allocationMethod'] })}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
          </select>
        </div>
        <div>
          <label className="label">Value</label>
          <input className="input" type="number" min={0} step="0.01" value={form.allocationValue} onChange={(event) => setForm({ ...form, allocationValue: Number(event.target.value) })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Color</label>
          <input className="input h-11" type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
        </div>
        <label className="flex items-end gap-2 text-sm font-semibold pb-3">
          <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
          Active
        </label>
      </div>

      <div>
        <p className="label mb-2">Linked expense categories</p>
        <div className="flex flex-wrap gap-2 max-h-28 overflow-auto">
          {categories.map((category) => (
            <button
              key={category._id}
              type="button"
              onClick={() => toggleCategory(category._id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${selected.has(category._id) ? 'bg-terra text-white border-terra' : 'bg-white border-paper-mist2 text-ink/60'}`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </div>

      <BudgetSubItemList items={form.subItems} onChange={(subItems) => setForm({ ...form, subItems })} />

      <div>
        <label className="label">Note</label>
        <textarea className="input min-h-[70px]" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary">Save</button>
      </div>
    </form>
  );
}
