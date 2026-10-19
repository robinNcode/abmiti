import { Link } from 'react-router-dom';
import { Download, MessageSquare, ArrowRight, BookOpen, Star, Smartphone, Mail } from 'lucide-react';
import { getImageUrl, localizedApiError } from '@/utils';
import { useAuthStore } from '@/store/authStore';
import { AdSense } from '@/components/ui';
import { siteApi } from '@/api/site.api';
import { useEffect, useState } from 'react';
import { FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [config, setConfig] = useState<any>({});
  const [posts, setPosts] = useState<any[]>([]);
  const [contact, setContact] = useState({ name: '', email: '', message: '' });
  useEffect(() => { siteApi.config().then(setConfig).catch(() => {}); siteApi.publicPosts().then(setPosts).catch(() => {}); }, []);
  const sendContact = async (event: FormEvent) => { event.preventDefault(); try { await siteApi.contact(contact); setContact({ name: '', email: '', message: '' }); toast.success(t('Feedback sent. Thank you!')); } catch (error) { toast.error(localizedApiError(error, t, 'Could not send your message. Please try again.')); } };

  return (
    <div className="min-h-screen bg-paper-mist font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-terra text-white flex items-center justify-center font-bold text-xl shadow-md">
            আ
          </div>
            {config.logo ? <img src={config.logo} alt={config.title ?? 'Abmiti'} className="max-h-10 max-w-40 object-contain" /> : <span className="font-display font-bold text-xl tracking-tight text-ink">{config.title || 'Abmiti'}</span>}
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="flex items-center gap-2 text-ink/70 hover:text-terra font-medium transition-colors"><Star size={16} /> {t('Features')}</a>
          <a href="#blog" className="flex items-center gap-2 text-ink/70 hover:text-terra font-medium transition-colors"><BookOpen size={16} /> {t('Blog')}</a>
          <a href="#download" className="flex items-center gap-2 text-ink/70 hover:text-terra font-medium transition-colors"><Smartphone size={16} /> {t('Download')}</a>
          <a href="#contact" className="flex items-center gap-2 text-ink/70 hover:text-terra font-medium transition-colors"><Mail size={16} /> {t('Contact')}</a>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => { const next = i18n.language === 'en' ? 'bn' : 'en'; localStorage.setItem('i18nextLng', next); void i18n.changeLanguage(next); }} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/70 hover:text-terra" aria-label={t('language')}>
            <Languages size={16} /> {i18n.language === 'en' ? 'বাংলা' : 'English'}
          </button>
          {token ? (
            <Link to={user?.userType === 'admin' ? '/admin' : '/dashboard'} className="btn-primary">
              {user?.userType === 'admin' ? t('Admin panel') : t('Go to Dashboard')}
            </Link>
          ) : (
            <>
              <Link to="/login" className="font-medium text-ink/80 hover:text-terra transition-colors px-4 py-2">
                {t('Login')}
              </Link>
              <Link to="/register" className="btn-primary hidden sm:inline-flex">
                {t('Sign Up')}
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 max-w-7xl mx-auto text-center mt-10">
        <h1 className="text-5xl md:text-7xl font-black font-display text-ink tracking-tight leading-tight max-w-4xl mx-auto">
          {config.content?.heroTitle || t('Master your finances with confidence')}
        </h1>
        <p className="mt-6 text-lg md:text-xl text-ink/60 max-w-2xl mx-auto leading-relaxed">
          {config.subtitle || config.content?.heroSubtitle || t('Abmiti is your personal financial companion. Track expenses, monitor budgets, and achieve your financial goals with ease.')}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {!token && (
            <Link to="/register" className="btn-primary w-full sm:w-auto px-8 py-4 text-base rounded-2xl">
              {t('Get Started for Free')} <ArrowRight size={18} className="ml-2" />
            </Link>
          )}
          <a href="#download" className="bg-white border border-paper-mist2 text-ink hover:border-terra hover:text-terra font-semibold px-8 py-4 text-base rounded-2xl w-full sm:w-auto flex items-center justify-center gap-2 transition-all shadow-sm">
            <Download size={18} /> {t('Download App')}
          </a>
        </div>
      </section>

      {/* Public Ad Banner Below Hero */}
      <div className="max-w-7xl mx-auto px-6">
        <AdSense
          slotId={import.meta.env.VITE_ADSENSE_HERO_SLOT_ID}
          format="auto"
          className="my-8"
        />
      </div>

      {/* Features Summary */}
      <section id="features" className="bg-white py-24 border-y border-paper-mist2">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-ink">{t('Everything you need')}</h2>
            <p className="mt-4 text-ink/60">{t('Simple, intuitive tools to take control of your finances.')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-paper-mist border border-paper-mist2">
              <div className="w-12 h-12 rounded-xl bg-sage/20 text-sage flex items-center justify-center text-2xl mb-6">📊</div>
              <h3 className="text-xl font-bold text-ink mb-3">{t('Smart Analytics')}</h3>
              <p className="text-ink/60 leading-relaxed">{t('Visualize your spending patterns and track your savings rate with beautiful, easy-to-read charts.')}</p>
            </div>
            <div className="p-8 rounded-3xl bg-paper-mist border border-paper-mist2">
              <div className="w-12 h-12 rounded-xl bg-terra/20 text-terra flex items-center justify-center text-2xl mb-6">💰</div>
              <h3 className="text-xl font-bold text-ink mb-3">{t('Budget Tracking')}</h3>
              <p className="text-ink/60 leading-relaxed">{t('Set monthly limits and get warned before you overspend. Keep your finances perfectly balanced.')}</p>
            </div>
            <div className="p-8 rounded-3xl bg-paper-mist border border-paper-mist2">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center text-2xl mb-6">📱</div>
              <h3 className="text-xl font-bold text-ink mb-3">{t('Anywhere Access')}</h3>
              <p className="text-ink/60 leading-relaxed">{t('Manage your money on the go with our fully responsive web app and upcoming mobile applications.')}</p>
            </div>
          </div>
        </div>
      </section>

      {posts.length > 0 && <section id="blog" className="py-20 max-w-7xl mx-auto px-6"><h2 className="text-3xl font-bold font-display text-ink mb-8">{config.content?.blogTitle || t('From the Abmiti blog')}</h2><div className="grid md:grid-cols-3 gap-6">{posts.map((post) => <Link key={post._id ?? post.id} to={`/blog/${post.slug}`} className="group bg-white rounded-2xl border border-paper-mist2 hover:shadow-lift hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">{post.thumbnailUrl && <img src={getImageUrl(post.thumbnailUrl)} alt={post.title} className="w-full h-48 object-cover border-b border-paper-mist2" />}<div className="p-6 flex-1 flex flex-col"><h3 className="font-bold text-xl text-ink group-hover:text-terra transition-colors">{post.title}</h3>{post.excerpt && <p className="mt-3 text-ink/60 line-clamp-3 flex-1">{post.excerpt}</p>}<span className="mt-4 inline-flex items-center gap-1 text-terra text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">{t('Read more')} <ArrowRight size={14} /></span></div></Link>)}</div></section>}


      {/* Download Section */}
      <section id="download" className="py-24 max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold font-display text-ink mb-6">{t('Get Abmiti Mobile')}</h2>
        <p className="text-ink/60 max-w-xl mx-auto mb-10">
          {t('Take your financial tracker wherever you go. Download the Android APK directly and start tracking right from your pocket.')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/abmiti-release.apk" download className="btn-primary px-8 py-4 rounded-2xl flex items-center gap-3">
            <Download size={20} /> {t('Download APK (Android)')}
          </a>
        </div>
        <p className="mt-6 text-xs text-ink/40">{t('iOS version coming soon via App Store.')}</p>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-ink text-white py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <MessageSquare size={48} className="mx-auto text-terra mb-6 opacity-80" />
          <h2 className="text-3xl font-bold font-display mb-6">{config.content?.contactTitle || t("We'd love your feedback")}</h2>
          <p className="text-white/60 mb-10">
            {t('Abmiti is actively being improved. If you encounter bugs, have feature requests, or just want to say hi, please reach out!')}
          </p>
          <form className="space-y-4 max-w-md mx-auto text-left" onSubmit={sendContact}>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">{t('name')}</label>
              <input type="text" required onInvalid={(e) => e.currentTarget.setCustomValidity(t('This field is required'))} onInput={(e) => e.currentTarget.setCustomValidity('')} value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-terra transition-colors" placeholder={t('Your name')} />
            </div>
            <div><label className="block text-sm font-medium text-white/70 mb-1">{t('email')}</label><input type="email" required onInvalid={(e) => e.currentTarget.setCustomValidity(t('This field is required'))} onInput={(e) => e.currentTarget.setCustomValidity('')} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-terra transition-colors" placeholder={t('you@example.com')} /></div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">{t('Message')}</label>
              <textarea required onInvalid={(e) => e.currentTarget.setCustomValidity(t('This field is required'))} onInput={(e) => e.currentTarget.setCustomValidity('')} rows={4} value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-terra transition-colors" placeholder={t('How can we improve?')}></textarea>
            </div>
            <button type="submit" className="w-full bg-terra hover:bg-terra-dark text-white font-bold py-3 px-4 rounded-xl transition-colors">
              {t('Send Feedback')}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink border-t border-white/10 py-8 text-center text-white/40 text-sm">
        <div className="max-w-7xl mx-auto px-6 mb-6">
          <AdSense
            slotId={import.meta.env.VITE_ADSENSE_FOOTER_SLOT_ID}
            format="auto"
            className="my-4"
          />
        </div>
        <p>&copy; {new Date().getFullYear()} Abmiti. {t('All rights reserved.')}</p>
      </footer>
    </div>
  );
}
