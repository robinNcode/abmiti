import { Link } from 'react-router-dom';
import {
  Download, MessageSquare, ArrowRight, Star, Smartphone,
  Languages, ChevronDown, Play, Pause, TrendingUp, Wallet,
  PieChart, MessageCircle, Globe, ShieldCheck,
  BarChart3, Receipt, Target, Sparkles, BookOpen, Send, CreditCard,
} from 'lucide-react';
import { getImageUrl, localizedApiError, formatNumber, formatBDT } from '@/utils';
import { useAuthStore } from '@/store/authStore';
import { AdSense } from '@/components/ui';
import { siteApi } from '@/api/site.api';
import { useEffect, useState, useRef, useCallback, useMemo, FormEvent, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import heroDashboardImg from '@/assets/images/dashboard_inventory.png';
import paymentDesktopImg from '@/assets/images/payment-desktop.png';
import mobileAppImg from '@/assets/images/3d-casual-life-notebook-with-sticky-notes-notepad-and-phone.png';

// ── Scroll-reveal hook ──────────────────────────────────────
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.classList.add('visible');
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.unobserve(el); } },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

// ── Animated counter ────────────────────────────────────────
function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || target <= 0) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(el);
      let start = 0;
      const step = Math.max(1, Math.ceil(target / (duration / 16)));
      const timer = setInterval(() => {
        start = Math.min(start + step, target);
        setCount(start);
        if (start >= target) clearInterval(timer);
      }, 16);
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{formatNumber(count)}</span>;
}

// ── FAQ Item ────────────────────────────────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-paper-mist2 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 px-1 text-left group"
        aria-expanded={open}
      >
        <span className="font-semibold text-ink text-base md:text-lg pr-4 group-hover:text-terra transition-colors">{question}</span>
        <ChevronDown size={20} className={`text-ink/40 transition-transform duration-300 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`faq-answer ${open ? 'open' : ''}`}>
        <p className="text-ink/60 leading-relaxed pb-5 px-1">{answer}</p>
      </div>
    </div>
  );
}

interface DemoStep {
  key: string;
  icon: ReactNode;
  color: string;
  bgColor: string;
  mockUI: ReactNode;
}

// ── Demo steps data builder ─────────────────────────────────
function getDemoSteps(t: (key: string) => string): DemoStep[] {
  return [
    {
      key: 'step1',
      icon: <Receipt size={24} />,
      color: 'text-sage',
      bgColor: 'bg-sage/10',
      mockUI: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-sage/15 flex items-center justify-center"><span className="text-lg">💰</span></div>
            <div>
              <div className="text-sm font-bold text-ink">{t('landing.demo.ui.addIncome')}</div>
              <div className="text-xs text-ink/40">October 2026</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-paper-mist rounded-lg p-2.5">
              <div className="text-[10px] text-ink/40 uppercase font-bold tracking-wider mb-1">{t('amount')}</div>
              <div className="font-bold text-sage">{formatBDT(45000)}</div>
            </div>
            <div className="bg-paper-mist rounded-lg p-2.5">
              <div className="text-[10px] text-ink/40 uppercase font-bold tracking-wider mb-1">{t('category')}</div>
              <div className="font-bold text-ink text-sm">💼 {t('landing.demo.ui.salary')}</div>
            </div>
          </div>
          <div className="bg-paper-mist rounded-lg p-2.5">
            <div className="text-[10px] text-ink/40 uppercase font-bold tracking-wider mb-1">{t('note')}</div>
            <div className="text-sm text-ink/70">{t('landing.demo.ui.salaryOct')}</div>
          </div>
          <div className="flex gap-2">
            <span className="badge-bank text-xs">🏦 {t('bank')}</span>
            <span className="text-xs text-ink/30">via DBBL</span>
          </div>
        </div>
      ),
    },
    {
      key: 'step2',
      icon: <Target size={24} />,
      color: 'text-terra',
      bgColor: 'bg-terra/10',
      mockUI: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-terra/15 flex items-center justify-center"><span className="text-lg">📋</span></div>
            <div>
              <div className="text-sm font-bold text-ink">{t('landing.demo.ui.monthlyBudget')}</div>
              <div className="text-xs text-ink/40">{t('landing.demo.ui.incomeLabel')}: {formatBDT(45000)}</div>
            </div>
          </div>
          {[
            { name: `🏠 ${t('landing.demo.ui.rent')}`, pct: 33, amount: formatBDT(15000), color: 'bg-terra' },
            { name: `🛒 ${t('landing.demo.ui.groceries')}`, pct: 22, amount: formatBDT(10000), color: 'bg-mustard' },
            { name: `🚌 ${t('landing.demo.ui.transport')}`, pct: 11, amount: formatBDT(5000), color: 'bg-sage' },
          ].map((line) => (
            <div key={line.name} className="space-y-1">
              <div className="flex justify-between text-sm"><span className="text-ink/70">{line.name}</span><span className="font-semibold text-ink">{line.amount}</span></div>
              <div className="h-1.5 rounded-full bg-paper-mist2 overflow-hidden"><div className={`h-full rounded-full ${line.color}`} style={{ width: `${line.pct}%` }} /></div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'step3',
      icon: <TrendingUp size={24} />,
      color: 'text-mustard',
      bgColor: 'bg-mustard/10',
      mockUI: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-mustard/15 flex items-center justify-center"><span className="text-lg">📈</span></div>
            <div>
              <div className="text-sm font-bold text-ink">{t('landing.demo.ui.trackInvestments')}</div>
              <div className="text-xs text-ink/40">{t('landing.demo.ui.totalLabel')}: {formatBDT(120000)}</div>
            </div>
          </div>
          {[
            { sector: t('landing.demo.ui.stockMarket'), icon: '📊', amount: formatBDT(50000), trend: '+12%' },
            { sector: t('landing.demo.ui.savingsDeposit'), icon: '🏦', amount: formatBDT(45000), trend: '+8%' },
            { sector: t('landing.demo.ui.gold'), icon: '🪙', amount: formatBDT(25000), trend: '+5%' },
          ].map((inv) => (
            <div key={inv.sector} className="flex items-center gap-3 bg-paper-mist rounded-lg p-2.5">
              <span className="text-lg">{inv.icon}</span>
              <div className="flex-1"><div className="text-sm font-medium text-ink">{inv.sector}</div><div className="text-xs text-ink/40">{inv.amount}</div></div>
              <span className="text-xs font-bold text-sage">{inv.trend}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'step4',
      icon: <PieChart size={24} />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      mockUI: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><span className="text-lg">📊</span></div>
            <div>
              <div className="text-sm font-bold text-ink">{t('landing.demo.ui.monthlyAnalytics')}</div>
              <div className="text-xs text-ink/40">October 2026</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-sage/10 rounded-lg p-2 text-center"><div className="text-xs text-sage font-bold">{t('income')}</div><div className="font-bold text-sage text-sm">{formatBDT(45000)}</div></div>
            <div className="bg-terra/10 rounded-lg p-2 text-center"><div className="text-xs text-terra font-bold">{t('expense')}</div><div className="font-bold text-terra text-sm">{formatBDT(32000)}</div></div>
            <div className="bg-blue-50 rounded-lg p-2 text-center"><div className="text-xs text-blue-600 font-bold">{t('savings')}</div><div className="font-bold text-blue-600 text-sm">{formatBDT(13000)}</div></div>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink/60"><span>{t('savingsRate')}:</span><span className="font-bold text-sage">29%</span></div>
          <div className="space-y-1.5 pt-1">
            {[
              { name: `🏠 ${t('landing.demo.ui.rent')}`, width: '47%', color: 'bg-terra' },
              { name: `🛒 ${t('landing.demo.ui.groceries')}`, width: '25%', color: 'bg-mustard' },
              { name: `🚌 ${t('landing.demo.ui.transport')}`, width: '16%', color: 'bg-sage' },
              { name: `📱 ${t('landing.demo.ui.others')}`, width: '12%', color: 'bg-blue-500' },
            ].map((cat) => (
              <div key={cat.name} className="flex items-center gap-2 text-xs"><span className="w-24 text-ink/50 truncate">{cat.name}</span><div className="flex-1 h-1.5 rounded-full bg-paper-mist2 overflow-hidden"><div className={`h-full rounded-full ${cat.color}`} style={{ width: cat.width }} /></div></div>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'step5',
      icon: <MessageCircle size={24} />,
      color: 'text-bkash',
      bgColor: 'bg-pink-50',
      mockUI: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center"><span className="text-lg">📲</span></div>
            <div>
              <div className="text-sm font-bold text-ink">{t('landing.demo.ui.smsParser')}</div>
              <div className="text-xs text-ink/40">{t('landing.demo.ui.autoDetect')}</div>
            </div>
          </div>
          <div className="bg-paper-mist rounded-lg p-3 text-xs text-ink/60 font-mono leading-relaxed border border-paper-mist2">
            {t('landing.demo.ui.smsSample')}
          </div>
          <div className="flex items-center gap-2 text-xs"><span className="bg-sage/10 text-sage font-bold px-2 py-1 rounded-full">✓ {t('landing.demo.ui.parsed')}</span><span className="text-ink/40">{t('landing.demo.ui.confidenceHigh')}</span></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-paper-mist rounded-lg p-2"><div className="text-[10px] text-ink/40 uppercase font-bold tracking-wider">{t('amount')}</div><div className="font-bold text-terra text-sm">{formatBDT(5000)}</div></div>
            <div className="bg-paper-mist rounded-lg p-2"><div className="text-[10px] text-ink/40 uppercase font-bold tracking-wider">{t('source')}</div><div className="font-bold text-bkash text-sm">📱 {t('bkash')}</div></div>
          </div>
        </div>
      ),
    },
  ];
}

// ── Main Component ──────────────────────────────────────────
export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [config, setConfig] = useState<any>({});
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState<{ totalUsers: number; activeSubscribers: number } | null>(null);
  const [contact, setContact] = useState({ name: '', email: '', message: '' });

  // Demo state
  const demoSteps = useMemo(() => getDemoSteps(t), [t]);
  const [activeStep, setActiveStep] = useState(0);
  const [demoPlaying, setDemoPlaying] = useState(true);
  const demoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Scroll reveal refs
  const heroRef = useScrollReveal();
  const benefitsRef = useScrollReveal();
  const paymentRef = useScrollReveal();
  const demoRef = useScrollReveal();
  const statsRef = useScrollReveal();
  const testimonialRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const ctaRef = useScrollReveal();
  const blogRef = useScrollReveal();
  const downloadRef = useScrollReveal();
  const contactRef = useScrollReveal();

  // Load data
  useEffect(() => {
    siteApi.config().then(setConfig).catch(() => { });
    siteApi.publicPosts().then(setPosts).catch(() => { });
    siteApi.publicStats().then(setStats).catch(() => { });
  }, []);

  // Auto-advance demo
  const startDemoTimer = useCallback(() => {
    if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    demoTimerRef.current = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % demoSteps.length);
    }, 4000);
  }, [demoSteps.length]);

  useEffect(() => {
    if (demoPlaying) {
      startDemoTimer();
    } else if (demoTimerRef.current) {
      clearInterval(demoTimerRef.current);
    }
    return () => { if (demoTimerRef.current) clearInterval(demoTimerRef.current); };
  }, [demoPlaying, startDemoTimer]);

  const sendContact = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await siteApi.contact(contact);
      setContact({ name: '', email: '', message: '' });
      toast.success(t('Feedback sent. Thank you!'));
    } catch (error) {
      toast.error(localizedApiError(error, t, 'Could not send your message. Please try again.'));
    }
  };

  const benefits = [
    { key: 'track', icon: <Wallet size={28} />, color: 'text-sage', bg: 'bg-sage/10' },
    { key: 'budget', icon: <Target size={28} />, color: 'text-terra', bg: 'bg-terra/10' },
    { key: 'analytics', icon: <BarChart3 size={28} />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { key: 'sms', icon: <MessageCircle size={28} />, color: 'text-bkash', bg: 'bg-pink-50' },
    { key: 'bd', icon: <Globe size={28} />, color: 'text-mustard', bg: 'bg-mustard/10' },
    { key: 'halal', icon: <ShieldCheck size={28} />, color: 'text-sage-dark', bg: 'bg-sage/10' },
  ];

  const faqItems = Array.from({ length: 8 }, (_, i) => ({
    question: t(`landing.faq.q${i + 1}`),
    answer: t(`landing.faq.a${i + 1}`),
  }));

  return (
    <div className="min-h-screen bg-paper font-body">
      {/* ═══ Navigation ═══ */}
      <nav className="sticky top-0 z-50 bg-paper/80 backdrop-blur-xl border-b border-paper-mist2/60" id="landing-nav">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-terra text-white flex items-center justify-center font-bold text-lg shadow-md" aria-hidden="true">
              আ
            </div>
            {config.logo
              ? <img src={config.logo} alt={config.title ?? 'Abmiti'} className="max-h-9 max-w-36 object-contain" />
              : <span className="font-display font-bold text-lg tracking-tight text-ink">{config.title || 'Abmiti'}</span>}
          </div>

          <div className="hidden md:flex items-center gap-4 lg:gap-5">
            <a href="#features" className="inline-flex items-center gap-1.5 text-sm text-ink/70 hover:text-terra font-medium transition-colors">
              <Sparkles size={15} className="text-terra/70" />
              {t('Features')}
            </a>
            <a href="#demo" className="inline-flex items-center gap-1.5 text-sm text-ink/70 hover:text-terra font-medium transition-colors">
              <Play size={14} className="text-terra/70" />
              {t('landing.hero.cta.demo')}
            </a>
            {/* <a href="#faq" className="inline-flex items-center gap-1.5 text-sm text-ink/70 hover:text-terra font-medium transition-colors">
              <HelpCircle size={15} className="text-terra/70" />
              {t('FAQ')}
            </a> */}
            {posts.length > 0 && (
              <a href="#blog" className="inline-flex items-center gap-1.5 text-sm text-ink/70 hover:text-terra font-medium transition-colors">
                <BookOpen size={15} className="text-terra/70" />
                {t('Blog')}
              </a>
            )}
            <a href="#contact" className="inline-flex items-center gap-1.5 text-sm text-ink/70 hover:text-terra font-medium transition-colors">
              <Send size={14} className="text-terra/70" />
              {t('Contact')}
            </a>
            <a href="#download" className="inline-flex items-center gap-1.5 text-sm text-ink/70 hover:text-terra font-medium transition-colors">
              <Download size={15} className="text-terra/70" />
              {t('Download')}
            </a>
          </div>

          <div className="flex items-center gap-2">
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
              <>
                <Link to="/login" className="hidden sm:inline-flex text-sm font-medium text-ink/70 hover:text-terra px-3 py-2 transition-colors">
                  {t('Login')}
                </Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2">
                  {t('Sign Up')}
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ═══ Hero Section ═══ */}
      <section ref={heroRef} className="landing-section relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-terra/5 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-10 -right-32 w-96 h-96 rounded-full bg-sage/5 blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative px-4 sm:px-6 pt-12 pb-16 md:pt-20 md:pb-24 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Content */}
            <div className="lg:col-span-6 text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-terra/8 text-terra text-xs md:text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-terra/15">
                <ShieldCheck size={15} />
                {t('landing.hero.badge')}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-display text-ink tracking-tight leading-[1.12]">
                {config.content?.heroTitle || t('landing.hero.title')}{' '}
                <span className="landing-gradient-text">{t('landing.hero.titleHighlight')}</span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-ink/60 leading-relaxed max-w-xl">
                {config.subtitle || config.content?.heroSubtitle || t('landing.hero.subtitle')}
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {!token && (
                  <Link to="/register" className="btn-primary px-8 py-3.5 text-base rounded-2xl shadow-lift" id="hero-cta-register">
                    {t('landing.hero.cta.start')} <ArrowRight size={18} className="ml-1" />
                  </Link>
                )}
                <a href="#demo" className="bg-white border border-paper-mist2 text-ink hover:border-terra hover:text-terra font-semibold px-7 py-3.5 text-base rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm">
                  <Play size={16} /> {t('landing.hero.cta.demo')}
                </a>
              </div>

              {/* Social proof */}
              {stats && stats.totalUsers > 0 && (
                <div className="mt-8 flex items-center gap-3 text-xs md:text-sm text-ink/50 pt-2 border-t border-paper-mist2/60 max-w-md">
                  <div className="flex -space-x-2 shrink-0">
                    {['🧑‍💼', '👩‍💻', '👨‍🎓', '👩‍🏫'].map((emoji, i) => (
                      <div key={i} className="w-7 h-7 rounded-full bg-paper-mist border-2 border-paper flex items-center justify-center text-xs" aria-hidden="true">{emoji}</div>
                    ))}
                  </div>
                  <span>{t('landing.hero.trusted')} <strong className="text-ink/80">{formatNumber(stats.totalUsers)}+</strong> {t('landing.hero.users')}</span>
                </div>
              )}
            </div>

            {/* Right Column: Hero Dashboard Preview Image */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl border border-paper-mist2/80 bg-white/70 backdrop-blur-xl p-2.5 sm:p-3 shadow-lift overflow-hidden group hover:shadow-2xl transition-all duration-300">
                <div className="relative rounded-2xl overflow-hidden border border-paper-mist2">
                  <img
                    src={heroDashboardImg}
                    alt={t('smartFinance')}
                    className="w-full h-auto object-cover rounded-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                    loading="eager"
                  />
                  <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-inset ring-black/5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Ad */}
      <div className="max-w-7xl mx-auto px-6">
        <AdSense slotId={import.meta.env.VITE_ADSENSE_HERO_SLOT_ID} format="auto" className="my-4" />
      </div>

      {/* ═══ Benefits Section ═══ */}
      <section id="features" ref={benefitsRef} className="landing-section py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-ink tracking-tight">{t('landing.benefits.title')}</h2>
            <p className="mt-4 text-ink/55 max-w-2xl mx-auto text-balance">{t('landing.benefits.subtitle')}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map(({ key, icon, color, bg }) => (
              <div key={key} className="group p-6 md:p-8 rounded-2xl bg-white border border-paper-mist2 hover:shadow-lift hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl ${bg} ${color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  {icon}
                </div>
                <h3 className="text-lg font-bold text-ink mb-2">{t(`landing.benefit.${key}.title`)}</h3>
                <p className="text-ink/55 text-sm leading-relaxed">{t(`landing.benefit.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Payment Sources ═══ */}
      <section ref={paymentRef} className="landing-section bg-white border-y border-paper-mist2 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Heading, subtitle, and payment badges */}
            <div className="lg:col-span-6 text-left">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-xs md:text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-blue-100">
                <CreditCard size={15} />
                {t('landing.payment.title')}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-ink tracking-tight mb-4">
                {t('landing.payment.title')}
              </h2>
              <p className="text-ink/60 text-base md:text-lg mb-8 leading-relaxed max-w-xl">
                {t('landing.payment.subtitle')}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Cash', icon: '💵', cls: 'bg-paper-mist text-ink/70' },
                  { label: 'Bank', icon: '🏦', cls: 'bg-blue-50 text-blue-600' },
                  { label: 'bKash', icon: '📱', cls: 'bg-pink-50 text-bkash' },
                  { label: 'Nagad', icon: '💚', cls: 'bg-orange-50 text-nagad' },
                  { label: 'Rocket', icon: '🚀', cls: 'bg-purple-50 text-purple-600' },
                  { label: 'Card', icon: '💳', cls: 'bg-paper-mist text-ink/70' },
                ].map((src) => (
                  <div
                    key={src.label}
                    className={`inline-flex items-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm border border-paper-mist2 ${src.cls} hover:shadow-card hover:-translate-y-0.5 transition-all`}
                  >
                    <span className="text-xl">{src.icon}</span> {src.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Payment Illustration */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-paper-mist2 overflow-hidden shadow-lift bg-paper-mist/40 p-2.5 sm:p-3 group hover:shadow-2xl transition-all duration-300">
                <div className="rounded-2xl overflow-hidden border border-paper-mist2">
                  <img
                    src={paymentDesktopImg}
                    alt={t('landing.payment.title')}
                    className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Product Demo ═══ */}
      <section id="demo" ref={demoRef} className="landing-section py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-ink tracking-tight">{t('landing.demo.title')}</h2>
            <p className="mt-4 text-ink/55 max-w-2xl mx-auto">{t('landing.demo.subtitle')}</p>
          </div>

          <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">
            {/* Step list */}
            <div className="lg:col-span-2 space-y-2">
              {demoSteps.map((step, i) => (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => { setActiveStep(i); setDemoPlaying(false); }}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-300 border ${activeStep === i
                    ? 'demo-step-active shadow-sm'
                    : 'border-transparent hover:bg-paper-mist'
                    }`}
                  aria-current={activeStep === i ? 'step' : undefined}
                >
                  <div className={`w-10 h-10 rounded-xl ${step.bgColor} ${step.color} flex items-center justify-center flex-shrink-0`}>
                    {step.icon}
                  </div>
                  <div className="min-w-0">
                    <div className={`font-bold text-sm ${activeStep === i ? 'text-ink' : 'text-ink/60'}`}>
                      {t(`landing.demo.${step.key}.title`)}
                    </div>
                    <div className={`text-xs mt-0.5 line-clamp-1 ${activeStep === i ? 'text-ink/50' : 'text-ink/30'}`}>
                      {t(`landing.demo.${step.key}.desc`)}
                    </div>
                  </div>
                  {activeStep === i && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-terra animate-pulse-dot flex-shrink-0" aria-hidden="true" />
                  )}
                </button>
              ))}

              {/* Playback controls */}
              <div className="flex items-center gap-3 pt-3 px-1">
                <button
                  type="button"
                  onClick={() => setDemoPlaying(!demoPlaying)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/50 hover:text-terra transition-colors"
                  aria-label={demoPlaying ? t('landing.demo.paused') : t('landing.demo.playing')}
                >
                  {demoPlaying ? <Pause size={14} /> : <Play size={14} />}
                  {demoPlaying ? t('landing.demo.playing') : t('landing.demo.paused')}
                </button>
                <div className="flex gap-1 ml-auto">
                  {demoSteps.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${activeStep === i ? 'bg-terra' : 'bg-paper-mist2'}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Mock preview */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-paper-mist2 shadow-lift overflow-hidden">
                {/* Fake window bar */}
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-paper-mist2 bg-paper-mist/50">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" aria-hidden="true" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" aria-hidden="true" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" aria-hidden="true" />
                  <div className="ml-3 flex-1 bg-paper-mist rounded-md px-3 py-1 text-[10px] text-ink/30 font-mono">abmiti.app/dashboard</div>
                </div>
                <div className="p-5 md:p-6 min-h-[320px] flex items-start">
                  <div className="w-full animate-fade-in" key={activeStep}>
                    {demoSteps[activeStep].mockUI}
                  </div>
                </div>
                <div className="px-5 pb-4">
                  <p className="text-xs text-ink/40 text-center italic">{t(`landing.demo.${demoSteps[activeStep].key}.desc`)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Stats Section ═══ */}
      <section ref={statsRef} className="landing-section bg-ink text-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display">{t('landing.stats.title')}</h2>
            <p className="mt-3 text-white/50">{t('landing.stats.subtitle')}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black font-display text-terra">
                {stats ? <AnimatedCounter target={stats.totalUsers} /> : '—'}
              </div>
              <div className="text-sm text-white/50 mt-1">{t('landing.stats.users')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black font-display text-mustard">
                {stats ? <AnimatedCounter target={stats.activeSubscribers} /> : '—'}
              </div>
              <div className="text-sm text-white/50 mt-1">{t('landing.stats.subscribers')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black font-display text-sage-light">6</div>
              <div className="text-sm text-white/50 mt-1">{t('landing.stats.categories')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black font-display text-white">2</div>
              <div className="text-sm text-white/50 mt-1">{t('landing.stats.languages')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Testimonials ═══ */}
      <section ref={testimonialRef} className="landing-section py-20 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-ink mb-4">{t('landing.testimonials.title')}</h2>
          <p className="text-ink/50 mb-10">{t('landing.testimonials.subtitle')}</p>
          <div className="grid md:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-paper-mist2 p-6 text-left">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} size={14} className="text-mustard fill-mustard" />)}
                </div>
                <p className="text-ink/40 text-sm italic leading-relaxed">{t('landing.testimonials.placeholder')}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-paper-mist2 animate-pulse" />
                  <div>
                    <div className="w-20 h-3 bg-paper-mist2 rounded animate-pulse" />
                    <div className="w-14 h-2 bg-paper-mist2 rounded mt-1.5 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ Section ═══ */}
      <section id="faq" ref={faqRef} className="landing-section bg-white border-y border-paper-mist2 py-20 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-ink">{t('landing.faq.title')}</h2>
            <p className="mt-3 text-ink/50">{t('landing.faq.subtitle')}</p>
          </div>
          <div className="divide-y divide-paper-mist2 border border-paper-mist2 rounded-2xl bg-paper px-5 md:px-8">
            {faqItems.map((item, i) => (
              <FAQItem key={i} question={item.question} answer={item.answer} />
            ))}
          </div>
          {!token && (
            <div className="text-center mt-8">
              <p className="text-ink/40 text-sm mb-3">{t('landing.faq.subtitle')}</p>
              <Link to="/register" className="btn-primary px-6 py-3 rounded-xl" id="faq-cta-register">
                {t('landing.hero.cta.start')} <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ═══ Blog Section ═══ */}
      {posts.length > 0 && (
        <section id="blog" ref={blogRef} className="landing-section py-20 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold font-display text-ink tracking-tight">{config.content?.blogTitle || t('From the Abmiti blog')}</h2>
              <p className="text-ink/55 mt-2 text-sm">{t('landing.payment.subtitle')}</p>
            </div>
            <p className="text-ink/50 text-sm">{t('postCount', { count: posts.length })}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post._id ?? post.id}
                to={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl border border-paper-mist2 hover:shadow-lift hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
              >
                {post.thumbnailUrl && (
                  <img src={getImageUrl(post.thumbnailUrl)} alt={post.title} className="w-full h-48 object-cover border-b border-paper-mist2" />
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-xl text-ink group-hover:text-terra transition-colors">{post.title}</h3>
                  {post.excerpt && <p className="mt-3 text-ink/60 line-clamp-3 flex-1 text-sm">{post.excerpt}</p>}
                  <span className="mt-4 inline-flex items-center gap-1 text-terra text-sm font-medium">
                    {t('Read more')} <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══ Final CTA ═══ */}
      <section ref={ctaRef} className="landing-section py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-gradient-to-br from-ink via-ink to-ink/90 rounded-3xl px-6 py-14 md:px-12 md:py-20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-terra/10 blur-3xl" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-mustard/10 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">{t('landing.cta.title')}</h2>
              <p className="text-white/55 max-w-xl mx-auto mb-8 text-balance">{t('landing.cta.subtitle')}</p>
              {!token && (
                <Link to="/register" className="btn-primary px-8 py-4 text-base rounded-2xl shadow-xl" id="final-cta-register">
                  {t('landing.cta.button')} <ArrowRight size={18} className="ml-1" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Download Section ═══ */}
      <section id="download" ref={downloadRef} className="landing-section py-20 max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-sage/10 text-sage text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
          <Smartphone size={15} />
          {t('Anywhere Access')}
        </div>
        <h2 className="text-3xl md:text-4xl font-bold font-display text-ink mb-4">{t('Get Abmiti Mobile')}</h2>
        <p className="text-ink/55 max-w-xl mx-auto mb-8">
          {t('Take your financial tracker wherever you go. Download the Android APK directly and start tracking right from your pocket.')}
        </p>
        <div className="my-8 max-w-sm mx-auto flex justify-center">
          <img
            src={mobileAppImg}
            alt={t('Get Abmiti Mobile')}
            className="w-64 h-auto object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/abmiti-release.apk" download className="btn-primary px-8 py-4 rounded-2xl flex items-center gap-3" id="download-apk">
            <Download size={20} /> {t('Download APK (Android)')}
          </a>
        </div>
        <p className="mt-4 text-xs text-ink/35">{t('iOS version coming soon via App Store.')}</p>
      </section>

      {/* ═══ Contact Section ═══ */}
      <section id="contact" ref={contactRef} className="landing-section bg-ink text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 items-start">
            {/* Left — brand identity */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-terra/90 text-white text-xs md:text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-terra/15">
                <MessageSquare size={15} />
                {config.content?.contactTitle || t("We'd love your feedback")}
              </div>
              <p className="text-white/55 leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
                {t('Abmiti is actively being improved. If you encounter bugs, have feature requests, or just want to say hi, please reach out!')}
              </p>
              <div className="space-y-5 text-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#c25528]/10 flex items-center justify-center shrink-0">
                    <span className="text-lg">📍</span>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">{t('Address')}</p>
                    <p className="text-white/80 font-medium mt-0.5">Bashundhara R.A, Dhaka 1229, Bangladesh</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-terra/10 flex items-center justify-center shrink-0">
                    <span className="text-lg">✉️</span>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">{t('Email')}</p>
                    <a href="mailto:ogyx.digital@gmail.com" className="text-white/80 font-medium mt-0.5 hover:text-terra transition-colors">
                      ogyx.digital@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-mustard/10 flex items-center justify-center shrink-0">
                    <span className="text-lg">📱</span>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">{t('WhatsApp')}</p>
                    <a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer" className="text-white/80 font-medium mt-0.5 hover:text-terra transition-colors">
                      +880 1700 000 000
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — contact / feedback form */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
              <form className="space-y-4" onSubmit={sendContact}>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">{t('Your name')}</label>
                  <input
                    type="text"
                    required
                    onInvalid={(e) => e.currentTarget.setCustomValidity(t('This field is required'))}
                    onInput={(e) => e.currentTarget.setCustomValidity('')}
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-terra transition-colors placeholder:text-white/25"
                    placeholder={t('Your name')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">{t('Email')}</label>
                  <input
                    type="email"
                    required
                    onInvalid={(e) => e.currentTarget.setCustomValidity(t('This field is required'))}
                    onInput={(e) => e.currentTarget.setCustomValidity('')}
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-terra transition-colors placeholder:text-white/25"
                    placeholder={t('you@example.com')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">{t('Message')}</label>
                  <textarea
                    required
                    onInvalid={(e) => e.currentTarget.setCustomValidity(t('This field is required'))}
                    onInput={(e) => e.currentTarget.setCustomValidity('')}
                    rows={4}
                    value={contact.message}
                    onChange={(e) => setContact({ ...contact, message: e.target.value })}
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-terra transition-colors placeholder:text-white/25"
                    placeholder={t('How can we improve?')}
                  />
                </div>
                <button type="submit" className="w-full bg-terra hover:bg-terra-dark text-white font-bold py-3.5 px-4 rounded-xl transition-colors" id="contact-submit">
                  {t('Send Feedback')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

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
              {posts.length > 0 && <a href="#blog" className="text-xs text-white/35 hover:text-white/70 transition-colors">{t('Blog')}</a>}
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
