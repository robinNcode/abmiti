import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, Bell, CreditCard, Settings, MessageSquare, Shield, ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cx } from '@/utils';
import TopBar from './TopBar';

const ADMIN_NAV = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/blog', icon: FileText, label: 'Blog Posts' },
  { to: '/admin/contacts', icon: MessageSquare, label: 'Contact Messages' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { to: '/admin/config', icon: Settings, label: 'Site Config' },
];

const MOBILE_ADMIN_NAV = ADMIN_NAV.slice(0, 5);

export default function AdminLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      <aside className="hidden md:flex w-[260px] shrink-0 flex-col border-r border-white/[0.06] bg-[#13151c] sticky top-0 h-screen">
        <div className="px-5 pt-6 pb-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-terra to-terra-dark flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-base text-white tracking-tight leading-none">abmiti</p>
              <p className="text-[10px] text-terra-light font-medium tracking-widest uppercase mt-0.5">admin panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">
            {t('navAdmin')}
          </p>
          {ADMIN_NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cx(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150',
                isActive
                  ? 'bg-terra/15 text-terra-light shadow-sm'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/[0.04]',
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto md:pb-0 pb-16 flex flex-col">
        <TopBar
          variant="dark"
          left={
            <div className="flex items-center gap-2 min-w-0">
              <div className="md:hidden w-8 h-8 rounded-lg bg-gradient-to-br from-terra to-terra-dark flex items-center justify-center shrink-0">
                <Shield size={14} className="text-white" />
              </div>
              <span className="text-xs font-medium text-white/45 tracking-wider uppercase truncate">
                abmiti admin
              </span>
            </div>
          }
        />
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#13151c] border-t border-white/[0.06] flex z-20 pb-safe">
        {MOBILE_ADMIN_NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => cx(
              'flex-1 flex flex-col items-center justify-center py-2 px-1 text-[10px] font-medium transition-colors',
              isActive ? 'text-terra-light' : 'text-white/30',
            )}
          >
            <Icon size={18} className="mb-1" />
            <span className="truncate w-full text-center">{label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
