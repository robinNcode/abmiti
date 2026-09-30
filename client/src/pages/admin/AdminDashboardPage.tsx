import { useEffect, useState } from 'react';
import { siteApi } from '@/api/site.api';
import { Users, FileText, MessageSquare, CreditCard, TrendingUp, Bell, ArrowUpRight, DollarSign } from 'lucide-react';
import { cx } from '@/utils';

interface Stats {
  totalUsers: number; totalPosts: number; totalContacts: number;
  totalPayments: number; totalRevenue: number; totalSubscriptions: number; activeSubscriptions: number;
}

const StatCard = ({ icon: Icon, label, value, sub, accent }: {
  icon: any; label: string; value: string | number; sub?: string;
  accent: 'terra' | 'sage' | 'blue' | 'amber' | 'purple';
}) => {
  const colors = {
    terra:  { bg: 'bg-terra/10',  text: 'text-terra-light', icon: 'text-terra-light' },
    sage:   { bg: 'bg-sage/10',   text: 'text-sage-light',  icon: 'text-sage-light'  },
    blue:   { bg: 'bg-blue-500/10', text: 'text-blue-400',  icon: 'text-blue-400'    },
    amber:  { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'text-amber-400'  },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: 'text-purple-400' },
  }[accent];

  return (
    <div className="admin-card group hover:border-white/[0.1] transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center', colors.bg)}>
          <Icon size={18} className={colors.icon} />
        </div>
        <ArrowUpRight size={14} className="text-white/15 group-hover:text-white/30 transition-colors" />
      </div>
      <p className={cx('font-display text-2xl font-bold tracking-tight', colors.text)}>{value}</p>
      <p className="text-xs text-white/35 mt-1 font-medium">{label}</p>
      {sub && <p className="text-[10px] text-white/20 mt-0.5">{sub}</p>}
    </div>
  );
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentContacts, setRecentContacts] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      siteApi.adminStats(),
      siteApi.contacts().catch(() => []),
      siteApi.adminPayments().catch(() => []),
    ]).then(([s, c, p]) => {
      setStats(s);
      setRecentContacts((c as any[]).slice(0, 5));
      setRecentPayments((p as any[]).slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-terra-light border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-white/35 mt-1">Overview of your platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard icon={Users}      label="Total Users"         value={stats?.totalUsers ?? 0}         accent="blue" />
        <StatCard icon={DollarSign}  label="Total Revenue"       value={`৳${(stats?.totalRevenue ?? 0).toLocaleString()}`} sub={`${stats?.totalPayments ?? 0} payments`} accent="sage" />
        <StatCard icon={Bell}        label="Active Subscriptions" value={stats?.activeSubscriptions ?? 0} sub={`${stats?.totalSubscriptions ?? 0} total`} accent="purple" />
        <StatCard icon={MessageSquare} label="Contact Messages"  value={stats?.totalContacts ?? 0}      accent="amber" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-8">
        <StatCard icon={FileText}    label="Blog Posts"          value={stats?.totalPosts ?? 0}         accent="terra" />
        <StatCard icon={CreditCard}  label="Total Payments"      value={stats?.totalPayments ?? 0}      accent="blue" />
        <StatCard icon={TrendingUp}  label="Total Subscriptions" value={stats?.totalSubscriptions ?? 0}  accent="sage" />
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Contact Messages */}
        <div className="admin-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-base font-bold text-white/80">Recent Messages</h2>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25">{recentContacts.length} shown</span>
          </div>
          {recentContacts.length === 0 ? (
            <div className="py-8 text-center">
              <MessageSquare size={24} className="text-white/10 mx-auto mb-2" />
              <p className="text-xs text-white/25">No contact messages yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentContacts.map((c, i) => (
                <div key={c._id ?? c.id ?? i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-xs font-bold shrink-0">
                    {(c.name ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-white/70 truncate">{c.name}</span>
                      <span className="text-[10px] text-white/20 shrink-0">{c.email}</span>
                    </div>
                    <p className="text-[11px] text-white/35 line-clamp-2">{c.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="admin-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-base font-bold text-white/80">Recent Payments</h2>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25">{recentPayments.length} shown</span>
          </div>
          {recentPayments.length === 0 ? (
            <div className="py-8 text-center">
              <CreditCard size={24} className="text-white/10 mx-auto mb-2" />
              <p className="text-xs text-white/25">No payments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((p, i) => (
                <div key={p._id ?? p.id ?? i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className={cx(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                    p.status === 'paid' ? 'bg-sage/10 text-sage-light' : 'bg-amber-500/10 text-amber-400',
                  )}>
                    {p.status === 'paid' ? '✓' : '⏳'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-white/70 capitalize">{p.plan}</span>
                      <span className={cx(
                        'admin-badge',
                        p.status === 'paid' ? 'admin-badge-success' : 'admin-badge-warning',
                      )}>{p.status}</span>
                    </div>
                    <p className="text-[10px] text-white/25 font-mono truncate">{p.transactionId ?? p.transaction_id ?? '—'}</p>
                  </div>
                  <span className="text-sm font-bold text-white/60 shrink-0">৳{(p.amount ?? 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
