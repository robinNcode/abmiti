import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader, Modal, EmptyState, Spinner } from '@/components/ui';
import { useEntries } from '@/hooks';
import { useMonthStore } from '@/store/monthStore';
import ExpenseForm from '@/components/entry/ExpenseForm';
import EntryRow from '@/components/entry/EntryRow';
import { formatBDT } from '@/utils';
import { useTranslation } from 'react-i18next';

export default function InvestmentsPage() {
  const { month, year } = useMonthStore();
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const { data, isLoading } = useEntries({ month, year, type: 'investment', page, limit: 20 });
  const { t } = useTranslation();

  const entries = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const totalInvested = entries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="min-h-full">
      <PageHeader
        title={t('investments')}
        subtitle={t('trackYourInvestmentEntries')}
        action={
          <button onClick={() => setModal(true)} className="btn-primary text-sm">+ {t('addInvestment')}</button>
        }
      />

      <div className="px-4 md:px-8 pb-10 space-y-4">
        <div className="card p-5">
          <p className="text-sm text-ink/50">Total invested this month</p>
          <p className="font-display text-3xl font-bold mt-2">{formatBDT(totalInvested)}</p>
        </div>

        <div className="card p-4">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner className="text-terra" /></div>
          ) : entries.length ? (
            <div className="space-y-2">
              {entries.map((entry, i) => (
                <EntryRow key={entry._id} entry={entry} style={{ animationDelay: `${i * 30}ms` }} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="📈"
              title={t('noInvestmentsYet')}
              subtitle={t('addYourFirstInvestmentEntry')}
            />
          )}
        </div>

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
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={t('addInvestment')}>
        <ExpenseForm type="investment" onSuccess={() => setModal(false)} />
      </Modal>
    </div>
  );
}
