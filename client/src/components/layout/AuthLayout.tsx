import { Outlet, useNavigate } from 'react-router-dom';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AuthLayout() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const toggleLanguage = () => {
    const nextLanguage = i18n.language === 'en' ? 'bn' : 'en';
    localStorage.setItem('i18nextLng', nextLanguage);
    void i18n.changeLanguage(nextLanguage);
  };
  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex w-96 shrink-0 flex-col justify-between bg-ink p-10"
        style={{ backgroundImage: 'radial-gradient(ellipse at 30% 20%, rgba(194,85,42,0.3) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(212,151,62,0.2) 0%, transparent 60%)' }}>
        <div>
          <p className="font-display font-black text-4xl text-terra leading-none">abmiti</p>
          <p className="font-bengali text-base text-mustard mt-1 font-semibold tracking-widest">আয় • ব্যয় • মিতি</p>
          <p className="text-white/40 text-sm mt-4 font-light leading-relaxed">
            {t('Track your income, expenses and savings — beautifully.')}
          </p>
        </div>
        <div className="space-y-4">
          {[
            { icon: '↑', label: t('income'), sub: t('Income from bank, bKash, Nagad') },
            { icon: '↓', label: t('expense'), sub: t('Categorised expenses') },
            { icon: '◈', label: t('savings'), sub: t('Savings & analytics') },
            { icon: '🏠', label: t('Home'), sub: t('Back to home'), event: () => navigate('/') },
          ].map((item) => (
            <div key={item.label} className={`flex items-start gap-3 ${item.event ? 'cursor-pointer' : ''}`} onClick={item.event}>
              <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center text-mustard font-bold text-sm shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-white font-semibold text-sm font-bengali">{item.label}</p>
                <p className="text-white/40 text-xs">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-white/20 text-xs">© {new Date().getFullYear()} abmiti</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm relative">
          <button type="button" onClick={toggleLanguage} title={t('language')} aria-label={t('language')} className="absolute -top-12 right-0 inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-terra">
            <Languages size={16} /> {i18n.language === 'en' ? 'বাংলা' : 'English'}
          </button>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
