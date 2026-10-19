import { useEffect, useState, useMemo } from 'react';
import { siteApi } from '@/api/site.api';
import { Search, CreditCard, Calendar, Hash, Tag, Activity } from 'lucide-react';
import { cx, formatBDT, formatNumber, localizedApiError } from '@/utils';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function AdminPaymentsPage() {
  const { t, i18n } = useTranslation();
  const [payments, setPayments] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'payments' | 'subscriptions'>('payments');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'active' | 'expired'>('all');

  useEffect(() => {
    Promise.all([
      siteApi.adminPayments().catch((error) => {
        toast.error(localizedApiError(error, t, 'Failed to load payments'));
        return [];
      }),
      siteApi.adminSubscriptions().catch((error) => {
        toast.error(localizedApiError(error, t, 'Failed to load subscriptions'));
        return [];
      }),
    ]).then(([p, s]) => {
      setPayments(p);
      setSubscriptions(s);
    }).finally(() => setLoading(false));
  }, [t]);

  const filteredItems = useMemo(() => {
    if (tab === 'payments') {
      let result = payments;
      if (search) {
        const q = search.toLowerCase();
        result = result.filter((p) =>
          (p.transactionId ?? p.transaction_id ?? '').toLowerCase().includes(q) ||
          (p.userId ?? p.user_id ?? '').toLowerCase().includes(q)
        );
      }
      if (statusFilter !== 'all' && ['paid', 'pending'].includes(statusFilter)) {
        result = result.filter((p) => p.status === statusFilter);
      }
      return result;
    } else {
      let result = subscriptions;
      if (search) {
        const q = search.toLowerCase();
        result = result.filter((s) =>
          (s.transactionId ?? s.transaction_id ?? '').toLowerCase().includes(q) ||
          (s.userId ?? s.user_id ?? '').toLowerCase().includes(q)
        );
      }
      if (statusFilter !== 'all' && ['active', 'expired'].includes(statusFilter)) {
        if (statusFilter === 'active') {
          result = result.filter((s) => s.status === 'active' && new Date(s.expiresAt ?? s.expires_at) >= new Date());
        } else {
          result = result.filter((s) => s.status !== 'active' || new Date(s.expiresAt ?? s.expires_at) < new Date());
        }
      }
      return result;
    }
  }, [tab, payments, subscriptions, search, statusFilter]);

  const totalRevenue = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
  const activeSubs = subscriptions.filter((s) => s.status === 'active' && new Date(s.expiresAt ?? s.expires_at) >= new Date()).length;
  const planLabel = (plan: string) => {
    if (plan === 'monthly') return t('Monthly');
    if (plan === 'annual' || plan === 'yearly') return t('Yearly');
    if (plan === 'coffee') return t('Coffee');
    return plan;
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-terra-light border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">{t('Payments & Subscriptions')}</h1>
          <p className="text-sm text-white/35 mt-0.5">{t('{{amount}} total revenue · {{total}} active subs', { amount: formatBDT(totalRevenue), total: formatNumber(activeSubs) })}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-card mb-4 !p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-white/[0.04] p-1 rounded-lg w-full sm:w-auto">
            <button onClick={() => { setTab('payments'); setStatusFilter('all'); }} className={cx('flex-1 sm:px-6 py-1.5 rounded-md text-xs font-semibold transition-all', tab === 'payments' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70')}>{t('Payments')}</button>
            <button onClick={() => { setTab('subscriptions'); setStatusFilter('all'); }} className={cx('flex-1 sm:px-6 py-1.5 rounded-md text-xs font-semibold transition-all', tab === 'subscriptions' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70')}>{t('Subscriptions')}</button>
          </div>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input type="text" placeholder={t('Search by transaction ID or user ID…')} value={search} onChange={(e) => setSearch(e.target.value)} className="admin-input pl-9 w-full" />
          </div>
          <div className="flex gap-2">
            <select className="admin-input w-full sm:w-32 py-1.5 capitalize" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
              <option value="all">{t('All status')}</option>
              {tab === 'payments' ? (
                <><option value="paid">{t('Paid')}</option><option value="pending">{t('Pending')}</option></>
              ) : (
                <><option value="active">{t('Active')}</option><option value="expired">{t('Expired')}</option></>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'payments' ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="w-14">#</th>
                  <th>{t('Transaction ID')}</th>
                  <th>{t('User ID')}</th>
                  <th>{t('Plan')}</th>
                  <th>{t('Amount')}</th>
                  <th>{t('Status')}</th>
                  <th>{t('Date')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr><td colSpan={7}><div className="py-12 text-center"><CreditCard size={24} className="text-white/10 mx-auto mb-2" /><p className="text-xs text-white/25">{t('No payments found')}</p></div></td></tr>
                ) : filteredItems.map((p, i) => {
                  const date = p.createdAt ?? p.created_at;
                  return (
                    <tr key={p._id ?? p.id ?? i}>
                      <td className="text-white/20 text-xs">{formatNumber(i + 1)}</td>
                      <td>
                        <div className="flex items-center gap-1.5 text-white/60">
                          <Hash size={12} className="text-white/20" />
                          <span className="text-xs font-mono">{p.transactionId ?? p.transaction_id ?? '—'}</span>
                        </div>
                      </td>
                      <td className="text-xs text-white/40 font-mono truncate max-w-[120px]">{p.userId ?? p.user_id}</td>
                      <td>
                        <div className="flex items-center gap-1.5 text-white/60">
                          <Tag size={12} className="text-white/20" />
                          <span className="text-xs capitalize">{planLabel(p.plan)}</span>
                        </div>
                      </td>
                      <td className="text-sm font-bold text-white/80">{formatBDT(p.amount ?? 0)}</td>
                      <td>
                        <span className={cx('admin-badge', p.status === 'paid' ? 'admin-badge-success' : 'admin-badge-warning')}>
                          {p.status === 'paid' ? t('Paid') : t('Pending')}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-white/25">
                          <Calendar size={11} />
                          <span className="text-[11px]">{date ? new Date(date).toLocaleDateString(i18n.language === 'bn' ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="w-14">#</th>
                  <th>{t('Plan')}</th>
                  <th>{t('User ID')}</th>
                  <th>{t('Transaction ID')}</th>
                  <th>{t('Status')}</th>
                  <th>{t('Started')}</th>
                  <th>{t('Expires')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr><td colSpan={7}><div className="py-12 text-center"><Activity size={24} className="text-white/10 mx-auto mb-2" /><p className="text-xs text-white/25">{t('No subscriptions found')}</p></div></td></tr>
                ) : filteredItems.map((s, i) => {
                  const started = s.startsAt ?? s.starts_at;
                  const expires = s.expiresAt ?? s.expires_at;
                  const isActive = s.status === 'active' && new Date(expires) >= new Date();
                  return (
                    <tr key={s._id ?? s.id ?? i}>
                      <td className="text-white/20 text-xs">{formatNumber(i + 1)}</td>
                      <td>
                        <div className="flex items-center gap-1.5 text-white/70 font-semibold">
                          <Tag size={12} className="text-white/20" />
                          <span className="text-xs capitalize">{planLabel(s.plan)}</span>
                        </div>
                      </td>
                      <td className="text-xs text-white/40 font-mono truncate max-w-[120px]">{s.userId ?? s.user_id}</td>
                      <td>
                        <div className="flex items-center gap-1.5 text-white/40">
                          <Hash size={12} className="text-white/20" />
                          <span className="text-xs font-mono">{s.transactionId ?? s.transaction_id ?? '—'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={cx('admin-badge', isActive ? 'admin-badge-info' : 'admin-badge-default')}>
                          {isActive ? t('Active') : t('Expired')}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-white/25">
                          <Calendar size={11} />
                          <span className="text-[11px]">{started ? new Date(started).toLocaleDateString(i18n.language === 'bn' ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-white/40">
                          <Calendar size={11} className={isActive ? 'text-terra-light/50' : 'text-white/20'} />
                          <span className={cx('text-[11px] font-medium', isActive ? 'text-terra-light' : 'text-white/30')}>
                            {expires ? new Date(expires).toLocaleDateString(i18n.language === 'bn' ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
