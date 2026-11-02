import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal, PageHeader, Spinner } from '@/components/ui';
import BudgetDrilldownModal from '@/components/budget/BudgetDrilldownModal';
import BudgetForecastCard from '@/components/budget/BudgetForecastCard';
import BudgetLineCard from '@/components/budget/BudgetLineCard';
import BudgetLineForm from '@/components/budget/BudgetLineForm';
import BudgetMonthNavigator from '@/components/budget/BudgetMonthNavigator';
import BudgetOverview from '@/components/budget/BudgetOverview';
import BudgetTemplateSelector from '@/components/budget/BudgetTemplateSelector';
import ExpenseForm from '@/components/entry/ExpenseForm';
import {
  useBudget,
  useBudgetAnalysis,
  useBudgetForecast,
  useBudgetMutations,
  useBudgetSummary,
  useBudgetTemplates,
  useCategories,
} from '@/hooks';
import { useMonthStore } from '@/store/monthStore';
import { BudgetLine } from '@/types';
import { formatBDT } from '@/utils';
import { useTranslation } from 'react-i18next';
import negotiationImg from '@/assets/images/clip-online-business-negotiation.png';

export default function BudgetPage() {
  const [editingLine, setEditingLine] = useState<BudgetLine | null>(null);
  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [entryModalLine, setEntryModalLine] = useState<BudgetLine | null>(null);
  const [incomeDraft, setIncomeDraft] = useState('');
  const [drilldownModal, setDrilldownModal] = useState<{ open: boolean; lineId?: string; title: string }>({
    open: false,
    title: '',
  });

  const { month, year } = useMonthStore();
  const { data: budget, isLoading } = useBudget();
  const { data: summary } = useBudgetSummary(budget?._id);
  const { data: analysis } = useBudgetAnalysis(budget?._id);
  const { data: forecast } = useBudgetForecast(budget?._id);
  const { data: templates = [], isLoading: templatesLoading } = useBudgetTemplates();
  const { data: categories = [] } = useCategories('expense');
  const mutations = useBudgetMutations();
  const { t } = useTranslation();

  const activePercentage = useMemo(() => (
    budget?.lines
      .filter((line) => line.isActive && line.allocationMethod === 'percentage')
      .reduce((sum, line) => sum + line.allocationValue, 0) ?? 0
  ), [budget?.lines]);

  const summaryByLine = useMemo(() => new Map(summary?.lines.map((line) => [line.lineId, line])), [summary?.lines]);
  const analysisByLine = useMemo(() => new Map(analysis?.lines.map((line) => [line.id, line])), [analysis?.lines]);
  const templateForMonth = templates.some((template) => template.month === month && template.year === year);
  const hasBudgetLines = budget?.lines.length > 0;

  if (isLoading) {
    return <div className="min-h-full flex items-center justify-center"><Spinner className="text-terra" /></div>;
  }

  if (!budget) return null;

  return (
    <div className="min-h-full">
      <PageHeader
        title={t('budget')}
        subtitle={t('budgetSubtitle')}
        action={<BudgetMonthNavigator />}
      />

      <div className="px-4 md:px-8 space-y-4 md:space-y-6 pb-10">
        <div className="card p-4 md:p-5 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <div className="flex items-center gap-4 flex-1">
            <img
              src={negotiationImg}
              alt="Budget Planning"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-sm shrink-0"
              loading="lazy"
            />
            <div>
              <p className="label">{t('monthlyBudgetLabel')}</p>
              <p className="font-display text-3xl font-black text-sage mt-1">{formatBDT(budget.totalIncome)}</p>
            </div>
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
              placeholder={t('monthlyBudgetInputPlaceholder')}
              value={incomeDraft}
              onChange={(event) => setIncomeDraft(event.target.value)}
            />
            <button className="btn-primary" type="submit">{t('update')}</button>
          </form>
        </div>

        {activePercentage > 100 && (
          <div className="rounded-lg border border-mustard/30 bg-mustard/10 text-mustard px-4 py-3 text-sm font-semibold">
            {t('Active percentage allocations total {{percent}}%. This is allowed, but planned spending exceeds the declared income base.', { percent: activePercentage })}
          </div>
        )}

        <BudgetTemplateSelector
          templates={templates}
          onApply={(templateId) => mutations.fromTemplate.mutate({ templateId, month, year })}
        />

        <BudgetOverview
          summary={summary}
          analysis={analysis}
          onDrilldownUnbudgeted={() =>
            setDrilldownModal({
              open: true,
              lineId: 'unbudgeted',
              title: t('Unbudgeted Outflows'),
            })
          }
        />

        <BudgetForecastCard forecast={forecast} />

        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">{t('budgetLines')}</h2>
          <div className="flex gap-2">
            <button
              className="btn-ghost text-sm disabled:cursor-not-allowed disabled:opacity-50"
              disabled={templatesLoading || templateForMonth || !hasBudgetLines || mutations.saveAsTemplate.isPending}
              onClick={() => mutations.saveAsTemplate.mutate({ id: budget._id, templateName: `${month}/${year} Budget` })}
            >
              {templateForMonth
                ? t('Template saved')
                : hasBudgetLines
                  ? t('Save template')
                  : t('Add budget lines before saving a template')}
            </button>
            <button
              className="btn-primary text-sm flex items-center gap-2"
              onClick={() => { setEditingLine(null); setLineModalOpen(true); }}
            >
              <Plus size={16} /> {t('Add line')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {budget.lines.map((line) => (
            <BudgetLineCard
              key={line._id}
              line={line}
              summary={summaryByLine.get(line._id)}
              computedLine={analysisByLine.get(line._id)}
              onAddEntry={() => setEntryModalLine(line)}
              onEdit={() => { setEditingLine(line); setLineModalOpen(true); }}
              onDelete={() => mutations.removeLine.mutate({ id: budget._id, lineId: line._id })}
              onViewEntries={() =>
                setDrilldownModal({
                  open: true,
                  lineId: line._id,
                  title: line.name,
                })
              }
            />
          ))}
        </div>
      </div>

      <Modal open={lineModalOpen} onClose={() => setLineModalOpen(false)} title={editingLine ? t('Edit budget line') : t('Add budget line')}>
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

      <Modal
        open={Boolean(entryModalLine)}
        onClose={() => setEntryModalLine(null)}
        title={t('Add Expense under {{line}}', { line: entryModalLine?.name })}
      >
        <ExpenseForm
          onSuccess={() => setEntryModalLine(null)}
          type="expense"
          initialBudgetLineId={entryModalLine?._id}
        />
      </Modal>

      <BudgetDrilldownModal
        open={drilldownModal.open}
        onClose={() => setDrilldownModal({ open: false, title: '' })}
        budgetId={budget._id}
        lineId={drilldownModal.lineId}
        title={drilldownModal.title}
      />
    </div>
  );
}
