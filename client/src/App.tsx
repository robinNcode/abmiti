import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import AppLayout from '@/components/layout/AppLayout';
import AuthLayout from '@/components/layout/AuthLayout';
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

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((s) => s.accessToken);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((s) => s.accessToken);
  return token ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter basename="/abmiti">
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        </Route>
        <Route path="/" element={<LandingPage />} />
        <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/entries"  element={<EntriesPage />} />
          <Route path="/investments" element={<InvestmentsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
