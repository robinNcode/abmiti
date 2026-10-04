import { useEffect, useState, useMemo } from 'react';
import { siteApi } from '@/api/site.api';
import toast from 'react-hot-toast';
import { Search, MessageSquare, Trash2, Mail, Calendar, AlertCircle, User, CheckCircle, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '@/utils';

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

  useEffect(() => {
    setLoading(true);
    siteApi.contacts(page, limit).then((res) => {
      setContacts(res.data);
      setTotal(res.total);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page]);

  const filtered = useMemo(() => {
    if (!search) return contacts;
    const q = search.toLowerCase();
    return contacts.filter((c) =>
      c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.message?.toLowerCase().includes(q)
    );
  }, [contacts, search]);

  const handleDelete = async (id: string) => {
    try {
      await siteApi.deleteContact(id);
      setContacts((cur) => cur.filter((c) => (c._id ?? c.id) !== id));
      toast.success('Message deleted');
      setTotal(t => Math.max(0, t - 1));
    } catch { toast.error('Failed to delete'); }
    setDeleteId(null);
  };

  const handleResolve = async (id: string, isResolved: boolean) => {
    try {
      await siteApi.resolveContact(id, isResolved);
      setContacts((cur) => cur.map((c) => (c._id ?? c.id) === id ? { ...c, is_resolved: isResolved, isResolved } : c));
      toast.success(isResolved ? 'Marked as resolved' : 'Marked as unread');
    } catch { toast.error('Failed to update status'); }
  };

  if (loading && contacts.length === 0) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-terra-light border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Contact Messages</h1>
          <p className="text-sm text-white/35 mt-0.5">{total} messages received</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-card mb-4 !p-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input type="text" placeholder="Search by name, email or message…" value={search} onChange={(e) => setSearch(e.target.value)} className="admin-input pl-9 w-full" />
        </div>
      </div>

      {/* Messages */}
      {filtered.length === 0 ? (
        <div className="admin-card py-16 text-center">
          <MessageSquare size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/25 font-medium">No messages found</p>
          <p className="text-xs text-white/15 mt-1">Contact messages from visitors will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, i) => {
            const cid = c._id ?? c.id ?? '';
            const date = c.createdAt ?? c.created_at;
            const isResolved = c.is_resolved || c.isResolved;
            return (
              <div key={cid || i} className={cx('admin-card group transition-all', isResolved ? 'opacity-60 hover:opacity-100' : 'hover:border-white/[0.1]')}>
                <div className="flex items-start gap-4">
                  <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors', isResolved ? 'bg-white/5 text-white/40' : 'bg-amber-500/10 text-amber-400')}>
                    {(c.name ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <User size={12} className="text-white/25" />
                        <span className={cx('text-sm font-semibold', isResolved ? 'text-white/40' : 'text-white/70')}>{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="text-white/20" />
                        <span className="text-xs text-white/35">{c.email}</span>
                      </div>
                      {date && (
                        <div className="flex items-center gap-1.5 sm:ml-auto">
                          <Calendar size={11} className="text-white/15" />
                          <span className="text-[10px] text-white/20">{new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>
                    <p className={cx(
                      'text-sm leading-relaxed transition-colors',
                      isResolved ? 'text-white/25' : 'text-white/40',
                      c.message?.length > 200 && !selectedMessage ? 'line-clamp-2' : '',
                    )}>{c.message}</p>
                    {c.message?.length > 200 && (
                      <button onClick={() => setSelectedMessage(selectedMessage?._id === cid ? null : c)} className="text-[10px] text-terra-light mt-1 hover:underline">
                        {selectedMessage?._id === cid || selectedMessage?.id === cid ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleResolve(cid, !isResolved)} className={cx('admin-icon-btn', isResolved ? 'text-amber-400/40 hover:text-amber-400' : 'text-sage-light/40 hover:text-sage-light')} title={isResolved ? 'Mark unread' : 'Mark resolved'}>
                      {isResolved ? <Circle size={14} /> : <CheckCircle size={14} />}
                    </button>
                    <button onClick={() => setDeleteId(cid)} className="admin-icon-btn text-red-400/40 hover:text-red-400" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 admin-card !py-3 !px-4">
          <p className="text-xs text-white/35">Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="admin-btn-ghost !px-2 !py-1.5 disabled:opacity-20">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold text-white/50 w-8 text-center">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="admin-btn-ghost !px-2 !py-1.5 disabled:opacity-20">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-[#1a1d27] border border-white/[0.08] rounded-2xl w-full max-w-sm shadow-2xl animate-fade-up p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white/80">Delete Message</h3>
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
