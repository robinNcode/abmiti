import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { siteApi } from '@/api/site.api';
import { getImageUrl } from '@/utils';
import { ArrowLeft, Calendar, Clock, Languages } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';

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
  const { t, i18n } = useTranslation();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    siteApi.config().then(setConfig).catch(() => { });
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
      <nav className="sticky top-0 z-50 bg-paper/80 backdrop-blur-xl border-b border-paper-mist2/60">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-terra text-white flex items-center justify-center font-bold text-lg shadow-md" aria-hidden="true">আ</div>
            {config.logo ? <img src={config.logo} alt={config.title ?? 'Abmiti'} className="max-h-9 max-w-36 object-contain" /> : <span className="font-display font-bold text-lg tracking-tight text-ink">{config.title || 'Abmiti'}</span>}
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/70 hover:text-terra transition-colors px-2 py-1.5">
            <ArrowLeft size={15} /> {t('Back to Home')}
          </Link>
        </div>
      </nav>
      <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-terra/10 flex items-center justify-center mb-6">
          <span className="text-4xl">📝</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-ink mb-3">{t('Post Not Found')}</h1>
        <p className="text-ink/50 mb-8 max-w-md">{t("The blog post you're looking for doesn't exist or is no longer published.")}</p>
        <Link to="/" className="btn-primary px-8 py-3 rounded-2xl">
          <ArrowLeft size={16} /> {t('Back to Home')}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper-mist font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-paper/80 backdrop-blur-xl border-b border-paper-mist2/60">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-terra text-white flex items-center justify-center font-bold text-lg shadow-md" aria-hidden="true">
              আ
            </div>
            {config.logo
              ? <img src={config.logo} alt={config.title ?? 'Abmiti'} className="max-h-9 max-w-36 object-contain" />
              : <span className="font-display font-bold text-lg tracking-tight text-ink">{config.title || 'Abmiti'}</span>}
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/#blog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/70 hover:text-terra transition-colors px-2 py-1.5"
            >
              <ArrowLeft size={15} />
              {t('Back to Blog')}
            </Link>

            <button
              type="button"
              onClick={() => { const next = i18n.language === 'en' ? 'bn' : 'en'; localStorage.setItem('i18nextLng', next); void i18n.changeLanguage(next); }}
              className="inline-flex items-center gap-1 text-sm font-medium text-ink/50 hover:text-terra px-2 py-1.5 rounded-lg hover:bg-paper-mist transition-colors"
              aria-label={t('language')}
            >
              <Languages size={15} /> {i18n.language === 'en' ? 'বাংলা' : 'EN'}
            </button>

            {token ? (
              <Link to={user?.userType === 'admin' ? '/admin' : '/dashboard'} className="btn-primary text-sm px-4 py-2">
                {user?.userType === 'admin' ? t('Admin panel') : t('Go to Dashboard')}
              </Link>
            ) : (
              <Link to="/login" className="btn-ghost text-sm px-4 py-2">
                {t('Login')}
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero / Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-terra/5 via-transparent to-mustard/5" />
        <div className="relative max-w-3xl mx-auto px-6 pt-12 pb-16 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-terra text-sm font-medium mb-6 hover:underline">
            <ArrowLeft size={14} /> {t('All Posts')}
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-ink leading-tight tracking-tight">{post.title}</h1>
          {post.excerpt && (
            <p className="mt-5 text-lg text-ink/50 leading-relaxed max-w-2xl mx-auto">{post.excerpt}</p>
          )}
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-ink/40">
            {created && (
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {new Date(created).toLocaleDateString(i18n.language === 'bn' ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {t('{{count}} min read', { count: readTime })}
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
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: ({ src, alt, ...props }) => (
                  <img
                    src={getImageUrl(src)}
                    alt={alt}
                    loading="lazy"
                    {...props}
                  />
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </div>
      </article>

      {/* Footer */}
      {/* ═══ Footer ═══ */}
      <footer className="bg-[#1b1610] border-t border-white/8 py-6 text-center text-white text-xs">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2">
            {/* Left: Logo / brand identity */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-6 h-6 rounded-lg bg-[#c25528] text-white flex items-center justify-center font-bold text-xs shadow-sm" aria-hidden="true">অ</div>
              <span className="font-display font-bold text-white/80 tracking-tight">{config.title || 'Abmiti'}</span>
              <p className="text-white/20">&copy; {new Date().getFullYear()} Abmiti. সর্বস্বত্ব সংরক্ষিত।</p>
            </div>

            {/* Center: navigation links */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 shrink-0">
              <a href="#features" className="text-xs text-white/35 hover:text-white/70 transition-colors">{t('Features')}</a>
              <a href="#faq" className="text-xs text-white/35 hover:text-white/70 transition-colors">{t('FAQ')}</a>
              {post?.excerpt && <a href="#blog" className="text-xs text-white/35 hover:text-white/70 transition-colors">{t('Blog')}</a>}
              <a href="#contact" className="text-xs text-white/35 hover:text-white/70 transition-colors">{t('Contact')}</a>
            </div>

            {/* Right: developer credits + social links */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-white/25">Developed by</span>
              <a href="https://github.com/robinncode" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors">
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.54-.17.54-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2.01-.27.68 0 1.36.09 2.01.27 1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38C13.71 14.53 16 11.53 16 8c0-4.42-3.58-8-8-8z" /></svg>
              </a>
              <a href="https://www.linkedin.com/in/robinncode/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.38-.02-3.16-1.96-3.16-1.96 0-2.27 1.45-2.27 2.93v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v5.57zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
