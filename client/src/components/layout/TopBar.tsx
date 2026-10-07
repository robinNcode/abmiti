import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Languages, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { UserAvatar } from '@/components/ui';
import { NotificationBell } from '@/components/notification/NotificationBell';
import { cx } from '@/utils';

type TopBarVariant = 'light' | 'dark';

function actionClass(variant: TopBarVariant, extra?: string) {
  return cx(
    'inline-flex items-center justify-center gap-1.5 h-9 min-w-9 px-0 lg:px-2.5 rounded-xl text-xs font-medium transition-colors duration-150',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-terra/30',
    variant === 'dark'
      ? 'text-white/50 hover:text-white hover:bg-white/[0.06]'
      : 'text-ink/55 hover:text-terra hover:bg-paper-mist',
    extra,
  );
}

export default function TopBar({
  variant = 'light',
  left,
}: {
  variant?: TopBarVariant;
  left: ReactNode;
}) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isDark = variant === 'dark';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en');
  };

  const langLabel = i18n.language === 'en' ? 'বাংলা' : 'English';

  return (
    <header
      className={cx(
        'sticky top-0 z-20 flex items-center justify-between gap-2 sm:gap-3 h-14 px-3 md:px-6 shrink-0',
        isDark
          ? 'bg-[#13151c]/90 backdrop-blur-sm border-b border-white/[0.06]'
          : 'bg-white/80 backdrop-blur-sm border-b border-paper-mist2',
      )}
    >
      <div className="min-w-0 flex-1">{left}</div>

      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        <NavLink
          to="/"
          end
          title={t('Home')}
          aria-label={t('Home')}
          className={({ isActive }) =>
            actionClass(
              variant,
              isActive
                ? isDark ? 'text-terra-light bg-white/[0.06]' : 'text-terra bg-terra/10'
                : undefined,
            )
          }
        >
          <Home size={16} />
          <span className="hidden lg:inline">{t('Home')}</span>
        </NavLink>

        <button
          type="button"
          onClick={toggleLanguage}
          title={t('language')}
          aria-label={t('language')}
          className={actionClass(variant)}
        >
          <Languages size={16} />
          <span className="hidden lg:inline">{langLabel}</span>
        </button>

        <NotificationBell tone={variant} />

        <div className={cx('w-px h-4 mx-1 hidden sm:block', isDark ? 'bg-white/10' : 'bg-paper-mist2')} />

        <NavLink
          to="/profile"
          title={t('Profile')}
          aria-label={t('Profile')}
          className={({ isActive }) =>
            cx(
              'flex items-center gap-2 rounded-xl h-9 pl-0.5 pr-1 md:pr-2.5 transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-terra/30',
              isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-paper-mist',
              isActive && (isDark ? 'bg-white/[0.06]' : 'bg-terra/10'),
            )
          }
        >
          <UserAvatar avatar={user?.avatar} name={user?.name} sizeClassName="w-7 h-7 text-xs" />
          <span className={cx(
            'hidden md:block text-xs font-semibold max-w-[108px] truncate',
            isDark ? 'text-white/80' : 'text-ink/80',
          )}>
            {user?.name}
          </span>
        </NavLink>

        <button
          type="button"
          onClick={handleLogout}
          title={t('Sign out')}
          aria-label={t('Sign out')}
          className={actionClass(variant)}
        >
          <LogOut size={16} />
          <span className="hidden lg:inline">{t('Sign out')}</span>
        </button>
      </div>
    </header>
  );
}
