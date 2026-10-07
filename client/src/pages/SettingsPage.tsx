import { useState } from 'react';
import { Trash2, Edit2, Plus, Wallet } from 'lucide-react';
import { PageHeader, Modal, Spinner, EmptyState } from '@/components/ui';
import { useBudgets, useDeleteBudget } from '@/hooks';
import BudgetForm from '@/components/entry/BudgetForm';
import BillingPanel from '@/components/settings/BillingPanel';
import { cx, formatBDT, SHORT_MONTHS } from '@/utils';
import { IBudget, IBudgetInput } from '@/types';
import { t } from 'i18next';

type SettingsTab = 'budgets' | 'billing';

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('budgets');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<IBudgetInput | undefined>();
  
  const { data: budgets = [], isLoading } = useBudgets();
  const deleteBudget = useDeleteBudget();

  const handleEdit = (b: IBudget) => {
    setEditData({ month: b.month, year: b.year, totalIncome: b.totalIncome });
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditData(undefined);
    setModalOpen(true);
  };

  return (
    <div className="min-h-full">
      <PageHeader
        title={t('settings')}
        subtitle="Manage your monthly budgets and preferences"
        action={
          tab === 'budgets' ? (
            <button onClick={handleAdd} className="btn-primary text-sm">
              <Plus size={14} /> Add Budget
            </button>
          ) : undefined
        }
      />

      <div className="px-4 md:px-8 pb-10">
        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          {([
            { key: 'budgets', label: 'Budgets', icon: null },
            { key: 'billing', label: 'Billing & Subscriptions', icon: <Wallet size={14} /> },
          ] as const).map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={cx(
                'px-5 py-2 rounded-xl text-sm font-medium border transition-all inline-flex items-center gap-2',
                tab === key
                  ? 'bg-terra text-white border-terra'
                  : 'border-paper-mist2 text-ink/60 hover:bg-paper-mist',
              )}>
              {icon}
              {label}
            </button>
          ))}
        </div>

        {tab === 'billing' ? (
          <BillingPanel />
        ) : (
        <div className="card p-6 w-full">
          <h2 className="font-display text-xl font-bold mb-4">Monthly Budgets</h2>
          <p className="text-sm text-ink/50 mb-6">
            Set and manage your budget for each month to track your spending.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner className="text-terra" /></div>
          ) : budgets.length > 0 ? (
            <div className="space-y-3">
              {budgets.map((b: IBudget) => (
                <div key={b._id} className="flex items-center justify-between p-4 border border-paper-mist2 rounded-xl hover:bg-paper-mist transition-colors">
                  <div>
                    <p className="font-semibold">{SHORT_MONTHS[b.month - 1]} {b.year}</p>
                    <p className="text-sm text-ink/60 mt-0.5">Declared income: {formatBDT(b.totalIncome)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(b)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-ink/50 hover:text-ink transition-colors shadow-sm border border-transparent hover:border-paper-mist2">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteBudget.mutate(b._id)} disabled={deleteBudget.isPending} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-ink/30 hover:text-red-500 transition-colors shadow-sm border border-transparent hover:border-red-100">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="💰" title="No Budgets" subtitle="Add a monthly budget to track your spending." />
          )}
        </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editData ? 'Edit Budget' : 'Add Budget'}>
        <BudgetForm onSuccess={() => setModalOpen(false)} initialData={editData} />
      </Modal>
    </div>
  );
}
