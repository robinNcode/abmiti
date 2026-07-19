import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, BarChart2, Tag, LogOut, Languages, TrendingUp, Settings, WalletCards, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useMonthStore } from '@/store/monthStore';
import { monthLabel } from '@/utils';
import { cx } from '@/utils';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/entries', icon: List, label: 'Entries' },
  { to: '/budget', icon: WalletCards, label: 'Budget' },
  { to: '/investments', icon: TrendingUp, label: 'Investments' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/categories', icon: Tag, label: 'Categories' },
  { to: '/category-report', icon: FileText, label: 'Report' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const MOBILE_NAV = NAV.slice(0, 6); // Include Categories

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { month, year, prev, next } = useMonthStore();
  const { t, i18n } = useTranslation();

  const handleLogout = () => { logout(); navigate('/login'); };
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'bn' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-paper-mist2 bg-white/60 backdrop-blur-sm sticky top-0 h-screen">
        {/* Brand */}
        <div className="px-5 pt-6 pb-4 border-b border-paper-mist2">
          <p className="font-display font-black text-2xl text-terra tracking-tight leading-none">abmiti</p>
          <p className="font-bengali text-xs text-mustard font-semibold mt-0.5 tracking-wide">আয় • ব্যয় • মিতি</p>
        </div>

        {/* Month nav */}
        <div className="px-4 py-3 border-b border-paper-mist2">
          <p className="label mb-1">{t('Period')}</p>
          <div className="flex items-center justify-between gap-1">
            <button onClick={prev} className="w-7 h-7 rounded-lg border border-paper-mist2 hover:bg-paper-mist flex items-center justify-center text-sm transition-colors">‹</button>
            <span className="text-xs font-semibold text-ink/70 flex-1 text-center">{monthLabel(month, year)}</span>
            <button onClick={next} className="w-7 h-7 rounded-lg border border-paper-mist2 hover:bg-paper-mist flex items-center justify-center text-sm transition-colors">›</button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/dashboard'}
              className={({ isActive }) => cx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-terra text-white shadow-sm'
                  : 'text-ink/60 hover:text-ink hover:bg-paper-mist',
              )}>
              <Icon size={16} />
              {t(label)}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-paper-mist2">
          <NavLink to="/profile" className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-terra/10 flex items-center justify-center text-terra font-bold text-sm">
              {user?.avatar || user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-ink/40 truncate">{user?.email}</p>
            </div>
          </NavLink>
          <button onClick={toggleLanguage}
            className="flex items-center gap-2 text-xs text-ink/40 hover:text-terra transition-colors w-full mb-2">
            <div className="w-8 h-8 rounded-full bg-terra/10 flex items-center justify-center text-terra font-bold text-sm">
              <Languages size={13} />
            </div>
            {i18n.language === 'en' ? 'বাংলা' : 'English'}
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-ink/40 hover:text-terra transition-colors w-full">
            <div className="w-8 h-8 rounded-full bg-terra/10 flex items-center justify-center text-terra font-bold text-sm">
              <LogOut size={13} />
            </div>
            {t('Sign out')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto md:pb-0 pb-16 flex flex-col">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-paper-mist2 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={prev} className="w-8 h-8 rounded-full bg-paper-mist flex items-center justify-center text-sm hover:bg-paper-mist2 transition-colors">‹</button>
            <span className="text-sm font-semibold text-ink min-w-[80px] text-center">{monthLabel(month, year)}</span>
            <button onClick={next} className="w-8 h-8 rounded-full bg-paper-mist flex items-center justify-center text-sm hover:bg-paper-mist2 transition-colors">›</button>
          </div>
          { /** On hover dropdown with profile and settings */}
          <div className="flex items-center gap-2">
            <button onClick={toggleLanguage}
              className="w-8 h-8 rounded-full bg-terra/10 flex items-center justify-center text-terra font-bold text-sm hover:bg-terra/20 transition-colors">
              {i18n.language === 'en' ? 'BN' : 'EN'}
            </button>
            <button onClick={handleLogout}
              className="w-8 h-8 rounded-full bg-terra/10 flex items-center justify-center text-terra font-bold text-sm hover:bg-terra/20 transition-colors">
              <LogOut size={13} />
            </button>
            <NavLink to="/settings" className="w-8 h-8 rounded-full bg-terra/10 flex items-center justify-center text-terra font-bold text-sm hover:bg-terra/20 transition-colors">
              <Settings size={13} />
            </NavLink>
            <NavLink to="/profile" className="w-8 h-8 rounded-full bg-terra/10 flex items-center justify-center text-terra font-bold text-sm hover:bg-terra/20 transition-colors">
              {user?.avatar || user?.name?.[0]?.toUpperCase()}
            </NavLink>
          </div>
        </div>
        <Outlet />
      </main>

      {/* Bottom Navbar - Visible on mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-paper-mist2 flex z-20 pb-safe">
        {MOBILE_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/dashboard'}
            className={({ isActive }) => cx(
              'flex-1 flex flex-col items-center justify-center py-2 px-1 text-[10px] font-medium transition-colors',
              isActive
                ? 'text-terra'
                : 'text-ink/60',
            )}>
            <Icon size={20} className="mb-1" />
            <span className="truncate w-full text-center">{t(label)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
