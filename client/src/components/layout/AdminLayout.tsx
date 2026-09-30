import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, Bell, CreditCard, Settings, LogOut, MessageSquare,
  Shield, ChevronRight, Home
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { UserAvatar } from '@/components/ui';
import { cx } from '@/utils';

const ADMIN_NAV = [
  { to: '/admin',               icon: LayoutDashboard, label: 'Dashboard',      end: true },
  { to: '/admin/users',         icon: Users,           label: 'Users',          end: false },
  { to: '/admin/blog',          icon: FileText,        label: 'Blog Posts',     end: false },
  { to: '/admin/contacts',      icon: MessageSquare,   label: 'Contact Messages', end: false },
  { to: '/admin/notifications', icon: Bell,            label: 'Notifications',  end: false },
  { to: '/admin/payments',      icon: CreditCard,      label: 'Payments',       end: false },
  { to: '/admin/config',        icon: Settings,        label: 'Site Config',    end: false },
  { to: '/',                    icon: Home,            label: 'Home',           end: false },
];

const MOBILE_ADMIN_NAV = ADMIN_NAV.slice(0, 5);

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      {/* ── Desktop Sidebar ────────────────────────────────────── */}
      <aside className="hidden md:flex w-[260px] shrink-0 flex-col border-r border-white/[0.06] bg-[#13151c] sticky top-0 h-screen">
        {/* Brand */}
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

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">Management</p>
          {ADMIN_NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => cx(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150',
                isActive
                  ? 'bg-terra/15 text-terra-light shadow-sm'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/[0.04]',
              )}>
              <Icon size={16} className="shrink-0" />
              <span className="flex-1">{label}</span>
              <ChevronRight size={12} className={cx(
                'opacity-0 group-hover:opacity-100 transition-opacity',
              )} />
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5 mb-3 min-w-0 overflow-hidden">
            <UserAvatar avatar={user?.avatar} name={user?.name} sizeClassName="w-8 h-8 text-sm" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white/80 truncate">{user?.name}</p>
              <p className="text-[10px] text-white/30 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-white/30 hover:text-terra-light transition-colors w-full">
            <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center">
              <LogOut size={12} />
            </div>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-y-auto md:pb-0 pb-16 flex flex-col">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#13151c] border-b border-white/[0.06] sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-terra to-terra-dark flex items-center justify-center">
              <Shield size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-sm text-white">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout}
              className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors">
              <LogOut size={14} />
            </button>
            <UserAvatar avatar={user?.avatar} name={user?.name} sizeClassName="w-8 h-8 text-sm" />
          </div>
        </div>

        <Outlet />
      </main>

      {/* ── Bottom Navbar - Mobile ─────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#13151c] border-t border-white/[0.06] flex z-20 pb-safe">
        {MOBILE_ADMIN_NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => cx(
              'flex-1 flex flex-col items-center justify-center py-2 px-1 text-[10px] font-medium transition-colors',
              isActive ? 'text-terra-light' : 'text-white/30',
            )}>
            <Icon size={18} className="mb-1" />
            <span className="truncate w-full text-center">{label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
