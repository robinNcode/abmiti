import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, List, BarChart2, Tag, TrendingUp, Settings, WalletCards,
  FileText, Shield, LifeBuoy,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useMonthStore } from '@/store/monthStore';
import { monthLabel } from '@/utils';
import { cx } from '@/utils';
import TopBar from './TopBar';

type NavItem = { to: string; icon: typeof LayoutDashboard; label: string; end?: boolean };

const OVERVIEW: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/entries', icon: List, label: 'Entries' },
];

const PLANNING: NavItem[] = [
  { to: '/budget', icon: WalletCards, label: 'Budget' },
  { to: '/investments', icon: TrendingUp, label: 'Investments' },
];

const INSIGHTS: NavItem[] = [
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/categories', icon: Tag, label: 'Categories' },
  { to: '/category-report', icon: FileText, label: 'Report' },
];

const MORE: NavItem[] = [
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/support', icon: LifeBuoy, label: 'Support' },
];

const MOBILE_NAV: NavItem[] = [
  OVERVIEW[0],
  OVERVIEW[1],
  PLANNING[0],
  INSIGHTS[0],
  MORE[1],
];

function NavGroup({ title, items }: { title: string; items: NavItem[] }) {
  const { t } = useTranslation();
  return (
    <div className="mb-4">
      <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink/35">
        {title}
      </p>
      <div className="space-y-0.5">
        {items.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => cx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150',
              isActive
                ? 'bg-terra text-white shadow-sm'
                : 'text-ink/60 hover:text-ink hover:bg-paper-mist',
            )}
          >
            <Icon size={16} className="shrink-0" />
            <span className="truncate">{t(label)}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { user } = useAuthStore();
  const { month, year, prev, next } = useMonthStore();
  const { t } = useTranslation();
  const isAdmin = user?.userType === 'admin';

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-paper-mist2 bg-white/70 backdrop-blur-sm sticky top-0 h-screen">
        <div className="px-5 pt-6 pb-5 border-b border-paper-mist2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-terra text-white flex items-center justify-center font-display font-bold text-lg shadow-sm">
              আ
            </div>
            <div>
              <p className="font-display font-black text-lg text-terra tracking-tight leading-none">abmiti</p>
              <p className="font-bengali text-[11px] text-mustard font-semibold mt-0.5 tracking-wide">আয় • ব্যয় • মিতি</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3.5 border-b border-paper-mist2">
          <p className="label mb-1.5">{t('Period')}</p>
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous month"
              className="w-8 h-8 rounded-xl border border-paper-mist2 hover:bg-paper-mist hover:border-terra/30 flex items-center justify-center text-sm text-ink/60 transition-colors"
            >
              ‹
            </button>
            <span className="text-xs font-semibold text-ink/75 flex-1 text-center tabular-nums">
              {monthLabel(month, year)}
            </span>
            <button
              type="button"
              onClick={next}
              aria-label="Next month"
              className="w-8 h-8 rounded-xl border border-paper-mist2 hover:bg-paper-mist hover:border-terra/30 flex items-center justify-center text-sm text-ink/60 transition-colors"
            >
              ›
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {isAdmin && (
            <NavGroup
              title={t('navAdmin')}
              items={[{ to: '/admin', icon: Shield, label: 'Admin Panel' }]}
            />
          )}
          <NavGroup title={t('navOverview')} items={OVERVIEW} />
          <NavGroup title={t('navPlanning')} items={PLANNING} />
          <NavGroup title={t('navInsights')} items={INSIGHTS} />
          <NavGroup title={t('navMore')} items={MORE} />
        </nav>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto md:pb-0 pb-16 flex flex-col">
        <TopBar
          variant="light"
          left={
            <>
              <div className="hidden md:flex items-center gap-2 min-w-0">
                <span className="text-xs font-semibold text-ink/45 uppercase tracking-wider">abmiti</span>
                <span className="text-xs text-ink/25">•</span>
                <span className="text-xs text-ink/50 font-medium truncate">{t('smartFinance')}</span>
              </div>
              <div className="md:hidden flex items-center gap-2">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous month"
                  className="w-8 h-8 rounded-xl bg-paper-mist flex items-center justify-center text-sm hover:bg-paper-mist2 transition-colors"
                >
                  ‹
                </button>
                <span className="text-sm font-semibold text-ink min-w-[88px] text-center tabular-nums">
                  {monthLabel(month, year)}
                </span>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next month"
                  className="w-8 h-8 rounded-xl bg-paper-mist flex items-center justify-center text-sm hover:bg-paper-mist2 transition-colors"
                >
                  ›
                </button>
              </div>
            </>
          }
        />
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-paper-mist2 flex z-20 pb-safe">
        {MOBILE_NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => cx(
              'flex-1 flex flex-col items-center justify-center py-2 px-1 text-[10px] font-medium transition-colors',
              isActive ? 'text-terra' : 'text-ink/50',
            )}
          >
            <Icon size={20} className="mb-1" />
            <span className="truncate w-full text-center">{t(label)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
