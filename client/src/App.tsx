import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import { Spinner } from '@/components/ui';
import { localizedApiError } from '@/utils';
import AppLayout from '@/components/layout/AppLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import LoginPage    from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import EntriesPage   from '@/pages/EntriesPage';
import InvestmentsPage from '@/pages/InvestmentsPage';
import SettingsPage from '@/pages/SettingsPage';
import CategoriesPage from '@/pages/CategoriesPage';
import AnalyticsPage  from '@/pages/AnalyticsPage';
import LandingPage    from '@/pages/LandingPage';
import BudgetPage     from '@/pages/BudgetPage';
import CategoryReportPage from '@/pages/CategoryReportPage';
import TransactionStatementPage from '@/pages/TransactionStatementPage';
import ProfilePage from '@/pages/ProfilePage';
import GoogleAuthCallback from '@/pages/GoogleAuthCallback';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminBlogPage from '@/pages/admin/AdminBlogPage';
import AdminContactsPage from '@/pages/admin/AdminContactsPage';
import AdminNotificationsPage from '@/pages/admin/AdminNotificationsPage';
import AdminPaymentsPage from '@/pages/admin/AdminPaymentsPage';
import AdminConfigPage from '@/pages/admin/AdminConfigPage';
import SupportPage from '@/pages/SupportPage';
import BlogPostPage from '@/pages/BlogPostPage';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { accessToken, user } = useAuthStore();
  return accessToken && user ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { accessToken, user } = useAuthStore();
  return accessToken && user ? <Navigate to={user.userType === 'admin' ? '/admin' : '/dashboard'} replace /> : <>{children}</>;
};

const UserRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((s) => s.user);
  return user?.userType === 'user' ? <>{children}</> : <Navigate to="/admin" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((s) => s.user);
  return user?.userType === 'admin' ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

export default function App() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const { t } = useTranslation();
  const [sessionReady, setSessionReady] = useState(!accessToken);
  const sessionKey = useAuthStore((s) => {
    const userId = s.user?._id ?? s.user?.id;
    return userId ? `${userId}:${s.user?.userType}` : null;
  });
  const previousSessionKey = useRef(sessionKey);

  useEffect(() => {
    if (!accessToken) {
      setSessionReady(true);
      return;
    }

    let active = true;
    void authApi.me()
      .then((user) => {
        if (active) setUser(user);
      })
      .catch((error: unknown) => {
        if (!active) return;
        toast.error(localizedApiError(error, t, 'Failed to retrieve user information'));
        logout();
      })
      .finally(() => {
        if (active) setSessionReady(true);
      });

    return () => {
      active = false;
    };
  }, [accessToken, logout, setUser, t]);

  useEffect(() => {
    const syncSession = (event: StorageEvent) => {
      if (event.key !== 'abmiti-auth') return;
      if (event.newValue === null) {
        logout();
      } else {
        void useAuthStore.persist.rehydrate();
      }
    };

    window.addEventListener('storage', syncSession);
    return () => window.removeEventListener('storage', syncSession);
  }, [logout]);

  useLayoutEffect(() => {
    if (previousSessionKey.current !== sessionKey) {
      queryClient.clear();
      previousSessionKey.current = sessionKey;
    }
  }, [queryClient, sessionKey]);

  if (!sessionReady) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner className="text-terra" /></div>;
  }

  return (
    <BrowserRouter basename="/abmiti">
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/auth/google/callback" element={<PublicRoute><GoogleAuthCallback /></PublicRoute>} />
        </Route>
        <Route path="/" element={<LandingPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route element={<PrivateRoute><AdminRoute><AdminLayout /></AdminRoute></PrivateRoute>}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/blog" element={<AdminBlogPage />} />
          <Route path="/admin/contacts" element={<AdminContactsPage />} />
          <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
          <Route path="/admin/payments" element={<AdminPaymentsPage />} />
          <Route path="/admin/config" element={<AdminConfigPage />} />
        </Route>

        <Route element={<PrivateRoute><UserRoute><AppLayout /></UserRoute></PrivateRoute>}>
          <Route path="/support" element={<SupportPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/entries"  element={<EntriesPage />} />
          <Route path="/investments" element={<InvestmentsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/category-report" element={<CategoryReportPage />} />
          <Route path="/transaction-statement" element={<TransactionStatementPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
