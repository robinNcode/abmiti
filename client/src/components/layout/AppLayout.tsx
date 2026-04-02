import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, BarChart2, Tag, LogOut, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMonthStore } from '@/store/monthStore';
import { monthLabel } from '@/utils';
import { cx } from '@/utils';

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/entries',    icon: List,            label: 'Entries'   },
  { to: '/analytics',  icon: BarChart2,       label: 'Analytics' },
  { to: '/categories', icon: Tag,             label: 'Categories'},
];

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { month, year, prev, next } = useMonthStore();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-paper-mist2 bg-white/60 backdrop-blur-sm sticky top-0 h-screen">
        {/* Brand */}
        <div className="px-5 pt-6 pb-4 border-b border-paper-mist2">
          <p className="font-display font-black text-2xl text-terra tracking-tight leading-none">abmiti</p>
          <p className="font-bengali text-xs text-mustard font-semibold mt-0.5 tracking-wide">আয় • বেয় • মিতি</p>
        </div>

        {/* Month nav */}
        <div className="px-4 py-3 border-b border-paper-mist2">
          <p className="label mb-1">Period</p>
          <div className="flex items-center justify-between gap-1">
            <button onClick={prev} className="w-7 h-7 rounded-lg border border-paper-mist2 hover:bg-paper-mist flex items-center justify-center text-sm transition-colors">‹</button>
            <span className="text-xs font-semibold text-ink/70 flex-1 text-center">{monthLabel(month, year)}</span>
            <button onClick={next} className="w-7 h-7 rounded-lg border border-paper-mist2 hover:bg-paper-mist flex items-center justify-center text-sm transition-colors">›</button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => cx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-terra text-white shadow-sm'
                  : 'text-ink/60 hover:text-ink hover:bg-paper-mist',
              )}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-paper-mist2">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-terra/10 flex items-center justify-center text-terra font-bold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-ink/40 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-ink/40 hover:text-terra transition-colors w-full">
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
