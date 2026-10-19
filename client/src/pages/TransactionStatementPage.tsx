import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Download, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { PageHeader, Spinner, EmptyState, FilterPanel } from '@/components/ui';
import { formatBDT, formatDate, cx } from '@/utils';
import { Category, EntryType } from '@/types';

interface TransactionStatementFilters {
  startDate: string;
  endDate: string;
  categoryIds?: string[];
  type?: EntryType;
}

interface TransactionStatementItem {
  _id: string;
  date: string;
  type: EntryType;
  amount: number;
  note: string;
  sector?: string;
  category: Category;
  source: string;
  account?: { name: string; type: string };
  runningBalance: number;
}

export default function TransactionStatementPage() {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<TransactionStatementFilters>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { register, handleSubmit, reset } = useForm<TransactionStatementFilters>({
    defaultValues: filters,
  });

  // Fetch categories for filter
  const { data: categories = [] } = useQuery({
    queryKey: ['cats', filters.type],
    queryFn: () => apiClient.get<{ data: Category[] }>('/categories', {
      params: filters.type ? { type: filters.type } : {},
    }).then((r) => r.data.data),
  });

  // Fetch statement data
  const { data: statementData, isLoading, refetch } = useQuery({
    queryKey: ['transaction-statement', filters],
    queryFn: async () => {
      const params: any = {
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
      if (filters.categoryIds?.length) params.categoryIds = filters.categoryIds.join(',');
      if (filters.type) params.type = filters.type;

      const response = await apiClient.get<{ data: TransactionStatementItem[] }>('/summary/transaction-statement', { params });
      return response.data.data;
    },
    enabled: !!filters.startDate && !!filters.endDate,
  });

  const onApplyFilters = handleSubmit((data) => {
    setFilters(data);
    refetch();
  });

  const onResetFilters = () => {
    const defaultFilters = {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    };
    reset(defaultFilters);
    setFilters(defaultFilters);
  };

  const exportToCSV = () => {
    if (!statementData?.length) return;

    const headers = [t('Date'), t('Category'), t('Details'), t('Method'), t('Dr'), t('Cr'), t('Balance')];
    const rows = statementData.map(item => [
      formatDate(item.date),
      item.category.name,
      `${t(item.type)}: ${item.note || '—'}`,
      item.source,
      ['expense', 'investment', 'savings', 'payable'].includes(item.type) ? item.amount.toFixed(2) : '',
      ['income', 'receivable'].includes(item.type) ? item.amount.toFixed(2) : '',
      item.runningBalance.toFixed(2),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction-statement-${filters.startDate}-to-${filters.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const finalBalance = statementData?.[statementData.length - 1]?.runningBalance ?? 0;
  return (
    <div className="min-h-full">
      <PageHeader
        title={t('Transaction Statement')}
        subtitle={t('statementSubtitle')}
        action={
          <button onClick={() => setShowFilters(!showFilters)} className="btn-primary text-sm">
            <Filter size={14} /> {showFilters ? t('Hide') : t('Show')} {t('Filters')}
          </button>
        }
      />

      <div className="px-4 md:px-8 pb-10 space-y-4">
        {/* Filters */}
        {showFilters && (
          <FilterPanel
            title={t('Filters')}
            onClose={() => setShowFilters(false)}
            onSubmit={onApplyFilters}
            onReset={onResetFilters}
            applyLabel={t('ApplyFilters') || 'Apply Filters'}
            resetLabel={t('Reset') || 'Reset'}
            inline
          >
            <div>
              <label className="label">{t('Start Date')}</label>
              <input {...register('startDate')} type="date" className="input min-h-[46px] bg-[#f7f2ea]" required />
            </div>
            <div>
              <label className="label">{t('End Date')}</label>
              <input {...register('endDate')} type="date" className="input min-h-[46px] bg-[#f7f2ea]" required />
            </div>
            <div>
              <label className="label">{t('Entry Type')}</label>
              <select {...register('type')} className="input min-h-[46px] bg-[#f7f2ea]">
                <option value="">{t('All Types')}</option>
                <option value="income">{t('Income')}</option>
                <option value="expense">{t('Expense')}</option>
                <option value="investment">{t('Investment')}</option>
                <option value="savings">{t('Savings')}</option>
                <option value="payable">{t('Payable')}</option>
                <option value="receivable">{t('Receivable')}</option>
              </select>
            </div>
            <div className="lg:col-span-3">
              <label className="label">{t('Categories') || 'Categories'}</label>
              <select {...register('categoryIds')} multiple title={t('Hold Ctrl/Cmd to select multiple')} className="input h-[46px] min-h-[46px] bg-[#f7f2ea]" size={1}>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </FilterPanel>
        )}

        {/* Summary */}
        {statementData && statementData.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            <div className="card p-5 border border-sage/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/45 mb-2">{t('Current Balance')}</p>
              <p className={cx(
                "font-display text-2xl font-bold",
                finalBalance >= 0 ? "text-sage" : "text-red-600"
              )}>{formatBDT(finalBalance)}</p>
            </div>
          </div>
        )}

        {/* Statement table */}
        <div className="card p-4">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner className="text-terra" /></div>
          ) : statementData && statementData.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-sm">{t('Transactions')}</p>
                <button onClick={exportToCSV} className="btn-ghost text-xs px-3 py-2">
                  <Download size={13} /> {t('Export CSV')}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full border-collapse border border-paper-mist2 text-sm">
                  <thead className="bg-paper-mist">
                    <tr className="text-left">
                      <th className="border border-paper-mist2 px-3 py-2 font-semibold text-ink/70">{t('Date')}</th>
                      <th className="border border-paper-mist2 px-3 py-2 font-semibold text-ink/70">{t('Category')}</th>
                      <th className="border border-paper-mist2 px-3 py-2 font-semibold text-ink/70">{t('Details')}</th>
                      <th className="border border-paper-mist2 px-3 py-2 font-semibold text-ink/70">{t('Method')}</th>
                      <th className="border border-paper-mist2 px-3 py-2 font-semibold text-ink/70 text-right">{t('Dr')}</th>
                      <th className="border border-paper-mist2 px-3 py-2 font-semibold text-ink/70 text-right">{t('Cr')}</th>
                      <th className="border border-paper-mist2 px-3 py-2 font-semibold text-ink/70 text-right">{t('Balance')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementData.map((item, i) => {
                      const isCredit = item.type === 'income' || item.type === 'receivable';
                      return (
                        <tr key={item._id} className="hover:bg-paper-mist transition-colors animate-fade-up"
                          style={{ animationDelay: `${i * 20}ms` }}>
                          <td className="border border-paper-mist2 px-3 py-2 text-ink/80 text-xs">{formatDate(item.date)}</td>
                    
                          <td className="border border-paper-mist2 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                                style={{ backgroundColor: item.category.color + '22', border: `2px solid ${item.category.color}35` }}>
                                {item.category.icon}
                              </div>
                              <span className="font-medium text-xs">{item.category.name}</span>
                            </div>
                          </td>
                          <td className="border border-paper-mist2 px-3 py-2">
                            <span className={cx(
                              "inline-block px-2 py-1 rounded text-xs font-medium capitalize",
                              isCredit ? "bg-sage/10 text-sage" : "bg-red-50 text-red-600"
                            )}>
                              {t(item.type)}: {item.note || '—'}
                            </span>
                          </td>
                          <td className="border border-paper-mist2 px-3 py-2 text-ink/60 text-xs whitespace-nowrap">
                            <span className={cx(
                              "inline-block px-2 py-1 rounded text-xs font-medium capitalize",
                              isCredit ? "bg-sage/10 text-sage" : "bg-red-50 text-red-600"
                            )}>
                              {item.source || '—' }
                            </span>
                          </td>
                          <td className="border border-paper-mist2 px-3 py-2 text-right font-semibold text-red-600">
                            {!isCredit && <span>−{formatBDT(item.amount)}</span>}
                          </td>
                          <td className="border border-paper-mist2 px-3 py-2 text-right font-semibold text-sage">
                            {isCredit && <span>+{formatBDT(item.amount)}</span>}
                          </td>
                          <td className="border border-paper-mist2 px-3 py-2 text-right">
                            <span className={cx(
                              "font-bold",
                              item.runningBalance >= 0 ? "text-sage" : "text-red-600"
                            )}>
                              {formatBDT(item.runningBalance)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-paper-mist">
                      <td colSpan={6} className="border border-paper-mist2 px-3 py-2 font-semibold text-right">{t('Final Balance')}</td>
                      <td className="border border-paper-mist2 px-3 py-2 text-right font-bold"
                        style={{ color: finalBalance >= 0 ? '#4CAF50' : '#F44336' }}>
                        {formatBDT(finalBalance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : (
            <EmptyState icon="💳" title={t('No Transactions Found')} subtitle={t('Adjust your filters to see transaction statement data')} />
          )}
        </div>
      </div>
    </div>
  );
}
