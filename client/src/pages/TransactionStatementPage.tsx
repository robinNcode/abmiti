import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Download, Filter, X, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { PageHeader, Spinner, EmptyState } from '@/components/ui';
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
  category: Category;
  source: string;
  runningBalance: number;
}

export default function TransactionStatementPage() {
  const { t, i18n } = useTranslation();
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

    const headers = [t('Date'), t('Type'), t('Category'), t('Note'), t('Source'), t('Amount'), t('Balance')];
    const rows = statementData.map(item => [
      formatDate(item.date),
      t(item.type),
      item.category.name,
      item.note,
      item.source,
      item.amount.toFixed(2),
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
  const totalTransactions = statementData?.length ?? 0;

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
          <div className="card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display font-bold text-base">{t('Filters')}</p>
              <button onClick={() => setShowFilters(false)} className="w-8 h-8 rounded-lg hover:bg-paper-mist flex items-center justify-center transition-colors" aria-label={t('Close')}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={onApplyFilters} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('Start Date')}</label>
                  <input {...register('startDate')} type="date" className="input" required />
                </div>
                <div>
                  <label className="label">{t('End Date')}</label>
                  <input {...register('endDate')} type="date" className="input" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('Entry Type')}</label>
                  <select {...register('type')} className="input">
                    <option value="">{t('All Types')}</option>
                    <option value="income">{t('Income')}</option>
                    <option value="expense">{t('Expense')}</option>
                    <option value="investment">{t('Investment')}</option>
                    <option value="savings">{t('Savings')}</option>
                    <option value="payable">{t('Payable')}</option>
                    <option value="receivable">{t('Receivable')}</option>
                  </select>
                </div>
                <div>
                  <label className="label">{t('Categories') || 'Categories'}</label>
                  <select {...register('categoryIds')} multiple className="input h-20" size={3}>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-ink/40 mt-1">{t('Hold Ctrl/Cmd to select multiple')}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  <Filter size={14} /> {t('ApplyFilters') || 'Apply Filters'}
                </button>
                <button type="button" onClick={onResetFilters} className="btn-ghost px-4">
                  {t('Reset') || 'Reset'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Summary */}
        {statementData && statementData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5 border border-sage/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/45 mb-2">{t('Current Balance')}</p>
              <p className={cx(
                "font-display text-2xl font-bold",
                finalBalance >= 0 ? "text-sage" : "text-red-600"
              )}>{formatBDT(finalBalance)}</p>
            </div>
            <div className="card p-5 border border-terra/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/45 mb-2">{t('Total Transactions')}</p>
              <p className="font-display text-2xl font-bold text-terra">{new Intl.NumberFormat(i18n.language === 'bn' ? 'bn-BD' : 'en-BD').format(totalTransactions)}</p>
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
                <table className="w-full text-sm">
                  <thead className="border-b border-paper-mist2">
                    <tr className="text-left">
                      <th className="pb-3 font-semibold text-ink/70">                      {t('Date')}</th>
                      <th className="pb-3 font-semibold text-ink/70 hidden md:table-cell">{t('Type')}</th>
                      <th className="pb-3 font-semibold text-ink/70">{t('Category')}</th>
                      <th className="pb-3 font-semibold text-ink/70 hidden lg:table-cell">{t('Note')}</th>
                      <th className="pb-3 font-semibold text-ink/70 hidden lg:table-cell">{t('Method')}</th>
                      <th className="pb-3 font-semibold text-ink/70 text-right">{t('Amount')}</th>
                      <th className="pb-3 font-semibold text-ink/70 text-right">{t('Balance')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementData.map((item, i) => {
                      const isCredit = item.type === 'income' || item.type === 'receivable';
                      return (
                        <tr key={item._id} className="border-b border-paper-mist2 last:border-0 hover:bg-paper-mist transition-colors animate-fade-up"
                          style={{ animationDelay: `${i * 20}ms` }}>
                          <td className="py-3 text-ink/80 text-xs">{formatDate(item.date)}</td>
                          <td className="py-3 hidden md:table-cell">
                            <span className={cx(
                              "inline-block px-2 py-1 rounded text-xs font-medium capitalize",
                              isCredit ? "bg-sage/10 text-sage" : "bg-red-50 text-red-600"
                            )}>
                              {t(item.type)}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                                style={{ backgroundColor: item.category.color + '22', border: `2px solid ${item.category.color}35` }}>
                                {item.category.icon}
                              </div>
                              <span className="font-medium text-xs">{item.category.name}</span>
                            </div>
                          </td>
                          <td className="py-3 text-ink/60 text-xs max-w-xs truncate hidden lg:table-cell">
                            {item.note || '—'}
                          </td>
                          <td className="py-3 text-ink/60 text-xs max-w-xs truncate hidden lg:table-cell">
                            <span className={cx(
                              "inline-block px-2 py-1 rounded text-xs font-medium capitalize",
                              isCredit ? "bg-sage/10 text-sage" : "bg-red-50 text-red-600"
                            )}>
                              {item.source || '—' }
                            </span>
                          </td>
                          <td className="py-3 text-right font-semibold">
                            <div className="flex items-center justify-end gap-1">
                              {isCredit ? (
                                <TrendingUp size={14} className="text-sage" />
                              ) : (
                                <TrendingDown size={14} className="text-red-600" />
                              )}
                              <span className={isCredit ? 'text-sage' : 'text-red-600'}>
                                {isCredit ? '+' : '−'}{formatBDT(item.amount)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-right">
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
