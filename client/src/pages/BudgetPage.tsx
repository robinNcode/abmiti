import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal, PageHeader, Spinner } from '@/components/ui';
import BudgetLineCard from '@/components/budget/BudgetLineCard';
import BudgetLineForm from '@/components/budget/BudgetLineForm';
import BudgetMonthNavigator from '@/components/budget/BudgetMonthNavigator';
import BudgetOverview from '@/components/budget/BudgetOverview';
import BudgetTemplateSelector from '@/components/budget/BudgetTemplateSelector';
import { useBudget, useBudgetMutations, useBudgetSummary, useBudgetTemplates, useCategories } from '@/hooks';
import { useMonthStore } from '@/store/monthStore';
import { BudgetLine } from '@/types';
import { formatBDT } from '@/utils';

export default function BudgetPage() {
  const [editingLine, setEditingLine] = useState<BudgetLine | null>(null);
  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [incomeDraft, setIncomeDraft] = useState('');
  const { month, year } = useMonthStore();
  const { data: budget, isLoading } = useBudget();
  const { data: summary } = useBudgetSummary(budget?._id);
  const { data: templates = [] } = useBudgetTemplates();
  const { data: categories = [] } = useCategories('expense');
  const mutations = useBudgetMutations();

  const activePercentage = useMemo(() => (
    budget?.lines
      .filter((line) => line.isActive && line.allocationMethod === 'percentage')
      .reduce((sum, line) => sum + line.allocationValue, 0) ?? 0
  ), [budget?.lines]);

  const summaryByLine = useMemo(() => new Map(summary?.lines.map((line) => [line.lineId, line])), [summary?.lines]);

  if (isLoading) {
    return <div className="min-h-full flex items-center justify-center"><Spinner className="text-terra" /></div>;
  }

  if (!budget) return null;

  return (
    <div className="min-h-full">
      <PageHeader
        title="Budget"
        subtitle="Plan monthly income, allocations, and category spending."
        action={<BudgetMonthNavigator />}
      />

      <div className="px-4 md:px-8 space-y-4 md:space-y-6 pb-10">
        <div className="card p-4 md:p-5 flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1">
            <p className="label">Declared monthly income</p>
            <p className="font-display text-3xl font-black text-sage mt-1">{formatBDT(budget.totalIncome)}</p>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              mutations.updateBudget.mutate({ id: budget._id, dto: { totalIncome: Number(incomeDraft || budget.totalIncome) } });
              setIncomeDraft('');
            }}
          >
            <input
              className="input w-44"
              type="number"
              min={0}
              placeholder="New income"
              value={incomeDraft}
              onChange={(event) => setIncomeDraft(event.target.value)}
            />
            <button className="btn-primary" type="submit">Update</button>
          </form>
        </div>

        {activePercentage > 100 && (
          <div className="rounded-lg border border-mustard/30 bg-mustard/10 text-mustard px-4 py-3 text-sm font-semibold">
            Active percentage allocations total {activePercentage}%. This is allowed, but planned spending exceeds the declared income base.
          </div>
        )}

        <BudgetTemplateSelector
          templates={templates}
          onApply={(templateId) => mutations.fromTemplate.mutate({ templateId, month, year })}
        />

        <BudgetOverview summary={summary} />

        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">Budget Lines</h2>
          <div className="flex gap-2">
            <button
              className="btn-ghost text-sm"
              onClick={() => mutations.saveAsTemplate.mutate({ id: budget._id, templateName: `${month}/${year} Budget` })}
            >
              Save template
            </button>
            <button
              className="btn-primary text-sm flex items-center gap-2"
              onClick={() => { setEditingLine(null); setLineModalOpen(true); }}
            >
              <Plus size={16} /> Add line
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {budget.lines.map((line) => (
            <BudgetLineCard
              key={line._id}
              line={line}
              summary={summaryByLine.get(line._id)}
              onEdit={() => { setEditingLine(line); setLineModalOpen(true); }}
              onDelete={() => mutations.removeLine.mutate({ id: budget._id, lineId: line._id })}
            />
          ))}
        </div>
      </div>

      <Modal open={lineModalOpen} onClose={() => setLineModalOpen(false)} title={editingLine ? 'Edit budget line' : 'Add budget line'}>
        <BudgetLineForm
          line={editingLine ?? undefined}
          categories={categories}
          onCancel={() => setLineModalOpen(false)}
          onSubmit={(line) => {
            if (editingLine) mutations.updateLine.mutate({ id: budget._id, lineId: editingLine._id, line });
            else mutations.addLine.mutate({ id: budget._id, line: { ...line, order: budget.lines.length } });
            setLineModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
