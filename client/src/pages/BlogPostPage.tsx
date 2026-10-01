import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { siteApi } from '@/api/site.api';
import { getImageUrl } from '@/utils';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Post {
  _id?: string; id?: string;
  title: string; slug: string; excerpt: string; content: string; published: boolean;
  thumbnailUrl?: string;
  createdAt?: string; created_at?: string; updatedAt?: string; updated_at?: string;
}

function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    siteApi.config().then(setConfig).catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug) return;
    let isActive = true;
    setLoading(true);
    setError(false);
    siteApi.publicPostBySlug(slug)
      .then(p => { if (isActive) setPost(p); })
      .catch(() => { if (isActive) setError(true); })
      .finally(() => { if (isActive) setLoading(false); });
    return () => { isActive = false; };
  }, [slug]);

  const created = post?.createdAt ?? post?.created_at;
  const readTime = post ? estimateReadTime(post.content) : 0;

  if (loading) return (
    <div className="min-h-screen bg-paper-mist flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-terra border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !post) return (
    <div className="min-h-screen bg-paper-mist font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-terra text-white flex items-center justify-center font-bold text-xl shadow-md">আ</div>
          {config.logo ? <img src={config.logo} alt={config.title ?? 'Abmiti'} className="max-h-10 max-w-40 object-contain" /> : <span className="font-display font-bold text-xl tracking-tight text-ink">{config.title || 'Abmiti'}</span>}
        </Link>
      </nav>
      <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-terra/10 flex items-center justify-center mb-6">
          <span className="text-4xl">📝</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-ink mb-3">Post Not Found</h1>
        <p className="text-ink/50 mb-8 max-w-md">The blog post you're looking for doesn't exist or is no longer published.</p>
        <Link to="/" className="btn-primary px-8 py-3 rounded-2xl">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper-mist font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-terra text-white flex items-center justify-center font-bold text-xl shadow-md">আ</div>
          {config.logo ? <img src={config.logo} alt={config.title ?? 'Abmiti'} className="max-h-10 max-w-40 object-contain" /> : <span className="font-display font-bold text-xl tracking-tight text-ink">{config.title || 'Abmiti'}</span>}
        </Link>
        <Link to="/" className="text-ink/60 hover:text-terra font-medium transition-colors flex items-center gap-2 text-sm">
          <ArrowLeft size={14} /> Back
        </Link>
      </nav>

      {/* Hero / Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-terra/5 via-transparent to-mustard/5" />
        <div className="relative max-w-3xl mx-auto px-6 pt-12 pb-16 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-terra text-sm font-medium mb-6 hover:underline">
            <ArrowLeft size={14} /> All Posts
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-ink leading-tight tracking-tight">{post.title}</h1>
          {post.excerpt && (
            <p className="mt-5 text-lg text-ink/50 leading-relaxed max-w-2xl mx-auto">{post.excerpt}</p>
          )}
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-ink/40">
            {created && (
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {new Date(created).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {readTime} min read
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-6 pb-24">
        {post.thumbnailUrl && <img src={getImageUrl(post.thumbnailUrl)} alt={post.title} className="w-full h-auto max-h-[400px] object-cover rounded-3xl mb-12 shadow-card" />}
        <div className="bg-white rounded-3xl border border-paper-mist2 shadow-card p-8 md:p-12">
          <div className="prose prose-lg prose-ink max-w-none
            prose-headings:font-display prose-headings:text-ink prose-headings:tracking-tight
            prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
            prose-p:text-ink/70 prose-p:leading-relaxed
            prose-a:text-terra prose-a:no-underline hover:prose-a:underline
            prose-strong:text-ink prose-strong:font-semibold
            prose-code:bg-paper-mist prose-code:text-terra-dark prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-[#1a1d27] prose-pre:text-white/90 prose-pre:rounded-2xl prose-pre:border prose-pre:border-white/[0.06]
            prose-blockquote:border-l-4 prose-blockquote:border-terra/30 prose-blockquote:bg-terra/[0.03] prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:px-4
            prose-img:rounded-2xl prose-img:shadow-md
            prose-li:text-ink/70
            prose-table:border-collapse
            prose-th:bg-paper-mist prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:text-sm prose-th:font-semibold
            prose-td:px-4 prose-td:py-2 prose-td:border-b prose-td:border-paper-mist2
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="bg-ink border-t border-white/10 py-8 text-center text-white/40 text-sm">
        <p>&copy; {new Date().getFullYear()} {config.title || 'Abmiti'}. All rights reserved.</p>
      </footer>
    </div>
  );
}
