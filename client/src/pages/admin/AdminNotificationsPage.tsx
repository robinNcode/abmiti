import { useEffect, useState, useCallback } from 'react';
import { siteApi } from '@/api/site.api';
import toast from 'react-hot-toast';
import {
  Bell, Send, Trash2, Users, User, Plus, X, AlertCircle, Calendar, CheckCheck,
  BarChart3, Eye, XCircle, TrendingUp, ChevronDown, ChevronUp, Filter
} from 'lucide-react';
import { cx } from '@/utils';

/* ── Tab Enum ─────────────────────────────────────────────────── */
type Tab = 'notifications' | 'report';

/* ── Helper: format date for display ─────────────────────────── */
const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = (d: string | Date) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/* ── Helper: last 30 days default ────────────────────────────── */
const defaultStart = () => {
  const d = new Date(); d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};
const defaultEnd = () => new Date().toISOString().slice(0, 10);

export default function AdminNotificationsPage() {
  const [tab, setTab] = useState<Tab>('notifications');

  /* ── Notifications tab state ─────────────────────────────────── */
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', message: '', targetUserId: '' });

  /* ── Report tab state ────────────────────────────────────────── */
  const [report, setReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  /* ── Fetch notifications ─────────────────────────────────────── */
  useEffect(() => {
    siteApi.adminNotifications().then(setNotifications).catch(() => {}).finally(() => setLoading(false));
  }, []);

  /* ── Fetch report ────────────────────────────────────────────── */
  const fetchReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const data = await siteApi.notificationReport(startDate, endDate);
      setReport(data);
    } catch {
      toast.error('Failed to load notification report');
    } finally {
      setReportLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (tab === 'report') fetchReport();
  }, [tab, fetchReport]);

  /* ── Handlers ────────────────────────────────────────────────── */
  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast.error('Title and message are required'); return; }
    setSending(true);
    try {
      await siteApi.sendNotification(form);
      const updated = await siteApi.adminNotifications();
      setNotifications(updated);
      setForm({ title: '', message: '', targetUserId: '' });
      setShowForm(false);
      toast.success('Notification sent');
    } catch { toast.error('Failed to send notification'); }
    finally { setSending(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await siteApi.deleteNotification(id);
      setNotifications((cur) => cur.filter((n) => (n._id ?? n.id) !== id));
      toast.success('Notification deleted');
    } catch { toast.error('Failed to delete'); }
    setDeleteId(null);
  };

  const toggleDate = (d: string) => setExpandedDates((prev) => {
    const next = new Set(prev);
    next.has(d) ? next.delete(d) : next.add(d);
    return next;
  });

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-terra-light border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full animate-fade-in">
      {/* Header + Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Notifications</h1>
          <p className="text-sm text-white/35 mt-0.5">
            {tab === 'notifications'
              ? `${notifications.length} notifications sent`
              : 'Date-wise notification analytics'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="flex items-center bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
            <button
              onClick={() => setTab('notifications')}
              className={cx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                tab === 'notifications'
                  ? 'bg-terra/20 text-terra-light shadow-sm'
                  : 'text-white/40 hover:text-white/60'
              )}
            >
              <Bell size={12} /> Manage
            </button>
            <button
              onClick={() => setTab('report')}
              className={cx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                tab === 'report'
                  ? 'bg-terra/20 text-terra-light shadow-sm'
                  : 'text-white/40 hover:text-white/60'
              )}
            >
              <BarChart3 size={12} /> Report
            </button>
          </div>

          {tab === 'notifications' && (
            <button onClick={() => setShowForm(true)} className="admin-btn-primary">
              <Plus size={14} /> Send Notification
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════ NOTIFICATIONS TAB ═══════════════ */}
      {tab === 'notifications' && (
        <>
          {notifications.length === 0 ? (
            <div className="admin-card py-16 text-center">
              <Bell size={32} className="text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/25 font-medium">No notifications sent</p>
              <p className="text-xs text-white/15 mt-1">Send your first notification to users</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n, i) => {
                const nid = n._id ?? n.id ?? '';
                const date = n.createdAt ?? n.created_at;
                const target = n.targetUserId ?? n.target_user_id;
                const readBy = Array.isArray(n.readBy) ? n.readBy : (Array.isArray(n.read_by) ? n.read_by : []);
                return (
                  <div key={nid || i} className="admin-card group hover:border-white/[0.1] transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                        <Bell size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1.5">
                          <h3 className="text-sm font-semibold text-white/70">{n.title}</h3>
                          <span className={cx('admin-badge', target ? 'admin-badge-info' : 'admin-badge-default')}>
                            {target ? <><User size={9} /> Specific user</> : <><Users size={9} /> All users</>}
                          </span>
                          <span className="admin-badge admin-badge-default text-[10px] flex items-center gap-1">
                            <CheckCheck size={11} className={readBy.length > 0 ? "text-emerald-400" : "text-white/20"} />
                            <span>Read by {readBy.length}</span>
                          </span>
                          {date && (
                            <div className="flex items-center gap-1.5 sm:ml-auto">
                              <Calendar size={11} className="text-white/15" />
                              <span className="text-[10px] text-white/20">{fmtDateTime(date)}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-white/35 leading-relaxed">{n.message}</p>
                        {target && (
                          <p className="text-[10px] text-white/20 mt-1.5 font-mono">Target: {target}</p>
                        )}
                      </div>
                      <button onClick={() => setDeleteId(nid)} className="admin-icon-btn text-red-400/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══════════════ REPORT TAB ═══════════════ */}
      {tab === 'report' && (
        <div className="space-y-6">
          {/* Date Filter */}
          <div className="admin-card">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Filter size={14} className="text-white/30 shrink-0" />
                <div className="flex-1">
                  <label className="admin-label">Start Date</label>
                  <input
                    type="date"
                    className="admin-input w-full"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="admin-label">End Date</label>
                  <input
                    type="date"
                    className="admin-input w-full"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <button onClick={fetchReport} disabled={reportLoading} className="admin-btn-primary shrink-0">
                {reportLoading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><BarChart3 size={14} /> Generate Report</>}
              </button>
            </div>
          </div>

          {reportLoading && !report && (
            <div className="flex-1 flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-terra-light border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {report && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Total Sent', value: report.summary.totalSent, icon: Send, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { label: 'Eligible Recipients', value: report.summary.totalEligibleRecipients, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                  { label: 'Total Reads', value: report.summary.totalReads, icon: Eye, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { label: 'Read Rate', value: `${report.summary.overallReadRate}%`, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  { label: 'Dismissed', value: report.summary.totalDismissed, icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                  { label: 'Active Users', value: report.summary.activeRegularUsers, icon: User, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                ].map((card) => (
                  <div key={card.label} className="admin-card text-center py-4">
                    <div className={cx('w-9 h-9 rounded-xl mx-auto mb-2.5 flex items-center justify-center', card.bg)}>
                      <card.icon size={16} className={card.color} />
                    </div>
                    <p className="text-lg font-bold text-white/80 font-display">{card.value}</p>
                    <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider mt-0.5">{card.label}</p>
                  </div>
                ))}
              </div>

              {/* Date-wise Breakdown */}
              <div>
                <h2 className="font-display font-bold text-lg text-white/70 mb-3">Date-wise Breakdown</h2>
                {report.dateWise.length === 0 ? (
                  <div className="admin-card py-12 text-center">
                    <Calendar size={28} className="text-white/10 mx-auto mb-3" />
                    <p className="text-sm text-white/25 font-medium">No notifications in this date range</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {report.dateWise.map((day: any) => {
                      const isExpanded = expandedDates.has(day.date);
                      return (
                        <div key={day.date} className="admin-card overflow-hidden transition-all">
                          {/* Day Header Row */}
                          <button
                            onClick={() => toggleDate(day.date)}
                            className="w-full flex items-center gap-4 text-left hover:bg-white/[0.02] -m-4 p-4 rounded-xl transition-colors"
                          >
                            <div className="w-10 h-10 rounded-xl bg-terra/10 flex items-center justify-center text-terra-light shrink-0">
                              <Calendar size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white/70">{fmtDate(day.date)}</p>
                              <p className="text-[10px] text-white/30 mt-0.5">
                                {day.count} notification{day.count !== 1 ? 's' : ''} sent
                              </p>
                            </div>
                            <div className="hidden sm:flex items-center gap-4 text-[11px]">
                              <span className="flex items-center gap-1 text-white/30">
                                <Users size={11} className="text-purple-400/50" /> {day.totalEligibleRecipients}
                              </span>
                              <span className="flex items-center gap-1 text-white/30">
                                <Eye size={11} className="text-emerald-400/50" /> {day.totalReads}
                              </span>
                              <span className={cx(
                                'admin-badge text-[10px]',
                                day.readRate >= 50 ? 'admin-badge-success' : day.readRate > 0 ? 'admin-badge-warning' : 'admin-badge-default'
                              )}>
                                {day.readRate}% read
                              </span>
                              <span className="flex items-center gap-1 text-white/30">
                                <XCircle size={11} className="text-rose-400/50" /> {day.totalDismissed}
                              </span>
                            </div>
                            <div className="text-white/20">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </button>

                          {/* Mobile Summary (shown below header on small screens) */}
                          <div className="sm:hidden flex items-center gap-3 mt-3 pt-2 border-t border-white/[0.04] text-[10px]">
                            <span className="flex items-center gap-1 text-white/30">
                              <Users size={10} /> {day.totalEligibleRecipients}
                            </span>
                            <span className="flex items-center gap-1 text-white/30">
                              <Eye size={10} /> {day.totalReads}
                            </span>
                            <span className={cx(
                              'admin-badge text-[10px]',
                              day.readRate >= 50 ? 'admin-badge-success' : day.readRate > 0 ? 'admin-badge-warning' : 'admin-badge-default'
                            )}>
                              {day.readRate}%
                            </span>
                          </div>

                          {/* Expanded Notifications */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                              {day.notifications.map((n: any) => (
                                <div key={n.id} className="flex items-start gap-3 pl-2">
                                  <div className="w-7 h-7 rounded-lg bg-blue-500/8 flex items-center justify-center text-blue-400/60 shrink-0 mt-0.5">
                                    <Bell size={12} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                      <p className="text-xs font-semibold text-white/60">{n.title}</p>
                                      <span className={cx('admin-badge text-[9px]', n.targetType === 'all_users' ? 'admin-badge-default' : 'admin-badge-info')}>
                                        {n.targetType === 'all_users' ? 'Broadcast' : 'Targeted'}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-white/30 leading-relaxed line-clamp-2">{n.message}</p>
                                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-white/25">
                                      <span className="flex items-center gap-1">
                                        <Users size={9} /> {n.eligibleRecipients} eligible
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Eye size={9} className="text-emerald-400/40" /> {n.readCount} read
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <TrendingUp size={9} /> {n.readRate}%
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <XCircle size={9} className="text-rose-400/40" /> {n.clearedCount} dismissed
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════ SEND NOTIFICATION MODAL ═══════════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !sending && setShowForm(false)} />
          <div className="relative bg-[#1a1d27] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h2 className="font-display font-bold text-lg text-white/80">Send Notification</h2>
              <button onClick={() => !sending && setShowForm(false)} className="admin-icon-btn"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="admin-label">Title <span className="text-terra-light">*</span></label>
                <input className="admin-input w-full" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notification title" />
              </div>
              <div>
                <label className="admin-label">Message <span className="text-terra-light">*</span></label>
                <textarea className="admin-input w-full min-h-[120px]" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Write your message…" />
              </div>
              <div>
                <label className="admin-label">Target User ID</label>
                <input className="admin-input w-full" value={form.targetUserId} onChange={(e) => setForm({ ...form, targetUserId: e.target.value })} placeholder="Leave blank to send to all users" />
                <p className="text-[10px] text-white/20 mt-1">Send to a specific user or broadcast to everyone.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} disabled={sending} className="admin-btn-ghost">Cancel</button>
              <button onClick={handleSend} disabled={sending} className="admin-btn-primary">
                {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={14} /> Send</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ DELETE CONFIRM MODAL ═══════════════ */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-[#1a1d27] border border-white/[0.08] rounded-2xl w-full max-w-sm shadow-2xl animate-fade-up p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center"><AlertCircle size={18} className="text-red-400" /></div>
              <div>
                <h3 className="font-display font-bold text-white/80">Delete Notification</h3>
                <p className="text-xs text-white/35">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="admin-btn-ghost">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="admin-btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
