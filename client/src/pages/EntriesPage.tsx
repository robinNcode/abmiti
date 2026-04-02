import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEntries } from '@/hooks';
import { useMonthStore } from '@/store/monthStore';
import { PageHeader, Modal, EmptyState, Spinner } from '@/components/ui';
import SmsEntryForm from '@/components/entry/SmsEntryForm';
import ExpenseForm from '@/components/entry/ExpenseForm';
import EntryRow from '@/components/entry/EntryRow';
import { cx } from '@/utils';

type TypeFilter = 'all' | 'income' | 'expense' | 'savings' | 'payable' | 'receivable';

export default function EntriesPage() {
  const { month, year } = useMonthStore();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<'income' | 'expense' | 'savings' | 'payable' | 'receivable' | null>(null);

  const { data, isLoading } = useEntries({
    month, year,
    type: typeFilter === 'all' ? undefined : typeFilter,
    page,
    limit: 15,
  });

  const entries    = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const total      = data?.meta?.total ?? 0;

  const filterBtns: { key: TypeFilter; label: string }[] = [
    { key: 'all',        label: 'All' },
    { key: 'income',     label: '↑ Income' },
    { key: 'expense',    label: '↓ Expense' },
    { key: 'savings',    label: '💰 Savings' },
    { key: 'payable',    label: '📤 Payable' },
    { key: 'receivable', label: '📥 Receivable' },
  ];

  return (
    <div className="min-h-full">
      <PageHeader
        title="Entries — খাতা"
        subtitle={`${total} entries this month`}
        action={
          <div className="flex gap-2">
            <button onClick={() => setModal('income')}     className="btn-sage text-sm">↑ Add Income</button>
            <button onClick={() => setModal('expense')}    className="btn-primary text-sm">↓ Add Expense</button>
            <button onClick={() => setModal('savings')}    className="btn-secondary text-sm">💰 Add Savings</button>
            <button onClick={() => setModal('payable')}    className="btn-warning text-sm">📤 Add Payable</button>
            <button onClick={() => setModal('receivable')} className="btn-info text-sm">📥 Add Receivable</button>
          </div>
        }
      />

      <div className="px-8 pb-10 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          {filterBtns.map(({ key, label }) => (
            <button key={key} onClick={() => { setTypeFilter(key); setPage(1); }}
              className={cx(
                'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                typeFilter === key && key === 'all'     ? 'bg-ink text-white border-ink' :
                typeFilter === key && key === 'income'  ? 'bg-sage text-white border-sage' :
                typeFilter === key && key === 'expense' ? 'bg-terra text-white border-terra' :
                typeFilter === key && key === 'savings' ? 'bg-yellow-500 text-white border-yellow-500' :
                typeFilter === key && key === 'payable' ? 'bg-red-500 text-white border-red-500' :
                typeFilter === key && key === 'receivable' ? 'bg-blue-500 text-white border-blue-500' :
                'border-paper-mist2 text-ink/60 hover:bg-paper-mist',
              )}>
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="card p-4">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner className="text-terra" /></div>
          ) : entries.length ? (
            <>
              <div className="space-y-2">
                {entries.map((entry, i) => (
                  <EntryRow key={entry._id} entry={entry} style={{ animationDelay: `${i * 30}ms` }} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-paper-mist2">
                  <p className="text-xs text-ink/40">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                      className="btn-ghost px-3 py-2 disabled:opacity-30">
                      <ChevronLeft size={15} />
                    </button>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="btn-ghost px-3 py-2 disabled:opacity-30">
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState icon="📒" title="No entries found" subtitle="Try changing filters or add a new entry" />
          )}
        </div>
      </div>

      <Modal open={modal === 'income'}  onClose={() => setModal(null)} title="Add Income — আয়">
        <SmsEntryForm onSuccess={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'expense'} onClose={() => setModal(null)} title="Add Expense — বেয়">
        <ExpenseForm onSuccess={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'savings'} onClose={() => setModal(null)} title="Add Savings — সঞ্চয়">
        <SmsEntryForm type="savings" onSuccess={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'payable'} onClose={() => setModal(null)} title="Add Payable — প্রদানযোগ্য">
        <ExpenseForm type="payable" onSuccess={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'receivable'} onClose={() => setModal(null)} title="Add Receivable — প্রাপ্তযোগ্য">
        <SmsEntryForm type="receivable" onSuccess={() => setModal(null)} />
      </Modal>
    </div>
  );
}
