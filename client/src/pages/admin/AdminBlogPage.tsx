import { useEffect, useState, useMemo } from 'react';
import { siteApi } from '@/api/site.api';
import toast from 'react-hot-toast';
import { Search, Plus, FileText, Edit3, Trash2, Eye, EyeOff, X, Save, AlertCircle, ExternalLink } from 'lucide-react';
import { cx } from '@/utils';
import MarkdownEditor from '@/components/ui/MarkdownEditor';

interface Post {
  _id?: string; id?: string;
  title: string; slug: string; excerpt: string; content: string; published: boolean;
  createdAt?: string; created_at?: string; updatedAt?: string; updated_at?: string;
}

const emptyPost: Post = { title: '', slug: '', excerpt: '', content: '', published: false };

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [editing, setEditing] = useState<Post | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    siteApi.posts().then(setPosts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = posts;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.title?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q));
    }
    if (statusFilter === 'published') result = result.filter((p) => p.published);
    if (statusFilter === 'draft') result = result.filter((p) => !p.published);
    return result;
  }, [posts, search, statusFilter]);

  const publishedCount = posts.filter((p) => p.published).length;

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.title?.trim() || !editing.slug?.trim() || !editing.content?.trim()) {
      toast.error('Title, slug and content are required'); return;
    }
    setSaving(true);
    try {
      const saved = await siteApi.savePost(editing);
      setPosts((cur) => editing._id || editing.id
        ? cur.map((p) => (p._id ?? p.id) === (editing._id ?? editing.id) ? saved : p)
        : [saved, ...cur]);
      setEditing(null);
      toast.success(editing._id || editing.id ? 'Post updated' : 'Post created');
    } catch { toast.error('Failed to save post'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await siteApi.deletePost(id);
      setPosts((cur) => cur.filter((p) => (p._id ?? p.id) !== id));
      toast.success('Post deleted');
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
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Blog Posts</h1>
          <p className="text-sm text-white/35 mt-0.5">{posts.length} posts · {publishedCount} published</p>
        </div>
        <button onClick={() => setEditing({ ...emptyPost })} className="admin-btn-primary">
          <Plus size={14} /> New Post
        </button>
      </div>

      {/* Toolbar */}
      <div className="admin-card mb-4 !p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input type="text" placeholder="Search posts…" value={search} onChange={(e) => setSearch(e.target.value)} className="admin-input pl-9 w-full" />
          </div>
          <div className="flex gap-2">
            {(['all', 'published', 'draft'] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={cx('px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize', statusFilter === s ? 'bg-terra/15 text-terra-light' : 'bg-white/[0.03] text-white/30 hover:text-white/50')}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts table */}
      <div className="admin-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="w-14">#</th>
                <th>Title</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Created</th>
                <th className="w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="py-12 text-center">
                    <FileText size={24} className="text-white/10 mx-auto mb-2" />
                    <p className="text-xs text-white/25">No posts found</p>
                  </div>
                </td></tr>
              ) : filtered.map((p, i) => {
                const pid = p._id ?? p.id ?? '';
                const created = p.createdAt ?? p.created_at;
                return (
                  <tr key={pid || i}>
                    <td className="text-white/20 text-xs">{i + 1}</td>
                    <td>
                      <div>
                        <p className="text-sm font-medium text-white/70 truncate max-w-xs">{p.title}</p>
                        {p.excerpt && <p className="text-[10px] text-white/25 truncate max-w-xs mt-0.5">{p.excerpt}</p>}
                      </div>
                    </td>
                    <td className="text-xs text-white/30 font-mono truncate max-w-[150px]">{p.slug}</td>
                    <td>
                      <span className={cx('admin-badge', p.published ? 'admin-badge-success' : 'admin-badge-warning')}>
                        {p.published ? <><Eye size={9} /> Published</> : <><EyeOff size={9} /> Draft</>}
                      </span>
                    </td>
                    <td className="text-[11px] text-white/25">{created ? new Date(created).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditing({ ...p, id: pid } as any)} className="admin-icon-btn" title="Edit"><Edit3 size={13} /></button>
                        {p.published && <a href={`/abmiti/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" className="admin-icon-btn text-blue-400/60 hover:text-blue-400" title="View post"><ExternalLink size={13} /></a>}
                        <button onClick={() => setDeleteId(pid)} className="admin-icon-btn text-red-400/60 hover:text-red-400" title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setEditing(null)} />
          <div className="relative bg-[#1a1d27] border border-white/[0.08] rounded-2xl w-full max-w-4xl shadow-2xl animate-fade-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] sticky top-0 bg-[#1a1d27] z-10">
              <h2 className="font-display font-bold text-lg text-white/80">{editing._id || editing.id ? 'Edit Post' : 'Create Post'}</h2>
              <button onClick={() => !saving && setEditing(null)} className="admin-icon-btn"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="admin-label">Title <span className="text-terra-light">*</span></label>
                <input className="admin-input w-full" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Post title" />
              </div>
              <div>
                <label className="admin-label">Slug <span className="text-terra-light">*</span></label>
                <input className="admin-input w-full" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="url-friendly-slug" />
                <p className="text-[10px] text-white/20 mt-1">URL-friendly identifier. Use lowercase with hyphens.</p>
              </div>
              <div>
                <label className="admin-label">Excerpt</label>
                <input className="admin-input w-full" value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} placeholder="Brief summary…" />
              </div>
              <div>
                <label className="admin-label">Content <span className="text-terra-light">*</span></label>
                <MarkdownEditor value={editing.content} onChange={(content) => setEditing({ ...editing, content })} placeholder="Write your blog post content using Markdown…" minHeight="300px" />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <input type="checkbox" id="published" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} className="admin-checkbox" />
                <label htmlFor="published" className="text-sm text-white/50 cursor-pointer select-none">Publish this post</label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end gap-3 sticky bottom-0 bg-[#1a1d27]">
              <button onClick={() => setEditing(null)} disabled={saving} className="admin-btn-ghost">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="admin-btn-primary">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={14} /> Save</>}
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
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white/80">Delete Post</h3>
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
