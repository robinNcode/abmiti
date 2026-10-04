import { useEffect, useState } from 'react';
import { siteApi } from '@/api/site.api';
import toast from 'react-hot-toast';
import { Bell, Send, Trash2, Users, User, Plus, X, AlertCircle, Calendar, CheckCheck } from 'lucide-react';
import { cx } from '@/utils';

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', message: '', targetUserId: '' });

  useEffect(() => {
    siteApi.adminNotifications().then(setNotifications).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast.error('Title and message are required'); return; }
    setSending(true);
    try {
      await siteApi.sendNotification(form);
      // Re-fetch to get the newly created notification
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
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Notifications</h1>
          <p className="text-sm text-white/35 mt-0.5">{notifications.length} notifications sent</p>
        </div>
        <button onClick={() => setShowForm(true)} className="admin-btn-primary"><Plus size={14} /> Send Notification</button>
      </div>

      {/* Notifications List */}
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
                          <span className="text-[10px] text-white/20">{new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
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

      {/* Send Notification Modal */}
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

      {/* Delete Confirm */}
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
