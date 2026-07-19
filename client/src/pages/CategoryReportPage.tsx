import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Download, Filter, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { PageHeader, Spinner, EmptyState } from '@/components/ui';
import { formatBDT } from '@/utils';
import { Category, EntryType } from '@/types';

interface CategoryReportFilters {
  startDate: string;
  endDate: string;
  categoryIds?: string[];
  minAmount?: number;
  maxAmount?: number;
  type?: EntryType;
}

interface CategoryReportItem {
  category: Category;
  total: number;
  count: number;
  avgAmount: number;
  minAmount: number;
  maxAmount: number;
}

export default function CategoryReportPage() {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<CategoryReportFilters>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { register, handleSubmit, reset } = useForm<CategoryReportFilters>({
    defaultValues: filters,
  });

  // Fetch categories for filter
  const { data: categories = [] } = useQuery({
    queryKey: ['cats', filters.type],
    queryFn: () => apiClient.get<{ data: Category[] }>('/categories', {
      params: filters.type ? { type: filters.type } : {},
    }).then((r) => r.data.data),
  });

  // Fetch report data
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['category-report', filters],
    queryFn: async () => {
      const params: any = {
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
      if (filters.categoryIds?.length) params.categoryIds = filters.categoryIds.join(',');
      if (filters.minAmount !== undefined && filters.minAmount > 0) params.minAmount = filters.minAmount;
      if (filters.maxAmount !== undefined && filters.maxAmount > 0) params.maxAmount = filters.maxAmount;
      if (filters.type) params.type = filters.type;

      const response = await apiClient.get<{ data: CategoryReportItem[] }>('/summary/category-report', { params });
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
    if (!reportData?.length) return;

    const headers = ['Category', 'Total Amount', 'Transaction Count', 'Average Amount', 'Min Amount', 'Max Amount'];
    const rows = reportData.map(item => [
      item.category.name,
      item.total,
      item.count,
      item.avgAmount.toFixed(2),
      item.minAmount,
      item.maxAmount,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `category-report-${filters.startDate}-to-${filters.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalAmount = reportData?.reduce((sum, item) => sum + item.total, 0) ?? 0;
  const totalCount = reportData?.reduce((sum, item) => sum + item.count, 0) ?? 0;

  return (
    <div className="min-h-full">
      <PageHeader
        title={t('Report') || 'Category Report'}
        subtitle={t('reportSubtitle') || 'Detailed breakdown by category with filters'}
        action={
          <button onClick={() => setShowFilters(!showFilters)} className="btn-primary text-sm">
            <Filter size={14} /> {showFilters ? 'Hide' : 'Show'} {t('Filters') || 'Filters'}
          </button>
        }
      />

      <div className="px-4 md:px-8 pb-10 space-y-4">
        {/* Filters */}
        {showFilters && (
          <div className="card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display font-bold text-base">{t('Filters') || 'Filters'}</p>
              <button onClick={() => setShowFilters(false)} className="w-8 h-8 rounded-lg hover:bg-paper-mist flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={onApplyFilters} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('StartDate') || 'Start Date'}</label>
                  <input {...register('startDate')} type="date" className="input" required />
                </div>
                <div>
                  <label className="label">{t('EndDate') || 'End Date'}</label>
                  <input {...register('endDate')} type="date" className="input" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('EntryType') || 'Entry Type'}</label>
                  <select {...register('type')} className="input">
                    <option value="">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                    <option value="investment">Investment</option>
                    <option value="savings">Savings</option>
                    <option value="payable">Payable</option>
                    <option value="receivable">Receivable</option>
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
                  <p className="text-xs text-ink/40 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('MinAmount') || 'Min Amount'}</label>
                  <input {...register('minAmount', { valueAsNumber: true })} type="number" step="0.01" min="0" placeholder="0" className="input" />
                </div>
                <div>
                  <label className="label">{t('MaxAmount') || 'Max Amount'}</label>
                  <input {...register('maxAmount', { valueAsNumber: true })} type="number" step="0.01" min="0" placeholder="No limit" className="input" />
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
        {reportData && reportData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5 border border-sage/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/45 mb-2">Total Amount</p>
              <p className="font-display text-2xl font-bold text-sage">{formatBDT(totalAmount)}</p>
            </div>
            <div className="card p-5 border border-terra/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/45 mb-2">Total Transactions</p>
              <p className="font-display text-2xl font-bold text-terra">{totalCount}</p>
            </div>
            <div className="card p-5 border border-blue-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/45 mb-2">Categories</p>
              <p className="font-display text-2xl font-bold text-blue-600">{reportData.length}</p>
            </div>
          </div>
        )}

        {/* Report table */}
        <div className="card p-4">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner className="text-terra" /></div>
          ) : reportData && reportData.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-sm">{t('CategoryBreakdown') || 'Category Breakdown'}</p>
                <button onClick={exportToCSV} className="btn-ghost text-xs px-3 py-2">
                  <Download size={13} /> {t('ExportCSV') || 'Export CSV'}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-paper-mist2">
                    <tr className="text-left">
                      <th className="pb-3 font-semibold text-ink/70">{t('Category') || 'Category'}</th>
                      <th className="pb-3 font-semibold text-ink/70 text-right">{t('Total') || 'Total'}</th>
                      <th className="pb-3 font-semibold text-ink/70 text-right hidden sm:table-cell">{t('Count') || 'Count'}</th>
                      <th className="pb-3 font-semibold text-ink/70 text-right hidden md:table-cell">{t('Avg') || 'Avg'}</th>
                      <th className="pb-3 font-semibold text-ink/70 text-right hidden lg:table-cell">{t('Min') || 'Min'}</th>
                      <th className="pb-3 font-semibold text-ink/70 text-right hidden lg:table-cell">{t('Max') || 'Max'}  </th>
                      <th className="pb-3 font-semibold text-ink/70 text-right">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((item, i) => {
                      const percentage = totalAmount > 0 ? ((item.total / totalAmount) * 100).toFixed(1) : 0;
                      return (
                        <tr key={item.category._id} className="border-b border-paper-mist2 last:border-0 hover:bg-paper-mist transition-colors animate-fade-up"
                          style={{ animationDelay: `${i * 30}ms` }}>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                                style={{ backgroundColor: item.category.color + '22', border: `2px solid ${item.category.color}35` }}>
                                {item.category.icon}
                              </div>
                              <span className="font-medium">{item.category.name}</span>
                            </div>
                          </td>
                          <td className="py-3 text-right font-semibold">{formatBDT(item.total)}</td>
                          <td className="py-3 text-right text-ink/60 hidden sm:table-cell">{item.count}</td>
                          <td className="py-3 text-right text-ink/60 hidden md:table-cell">{formatBDT(item.avgAmount)}</td>
                          <td className="py-3 text-right text-ink/60 hidden lg:table-cell">{formatBDT(item.minAmount)}</td>
                          <td className="py-3 text-right text-ink/60 hidden lg:table-cell">{formatBDT(item.maxAmount)}</td>
                          <td className="py-3 text-right">
                            <span className="inline-block bg-sage/10 text-sage px-2 py-1 rounded-lg text-xs font-semibold">
                              {percentage}%
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
            <EmptyState icon="📊" title="No Data Found" subtitle="Adjust your filters to see category report data" />
          )}
        </div>
      </div>
    </div>
  );
}
