import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import AppLayout from '@/components/layout/AppLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import LoginPage    from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import EntriesPage   from '@/pages/EntriesPage';
import CategoriesPage from '@/pages/CategoriesPage';
import AnalyticsPage  from '@/pages/AnalyticsPage';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((s) => s.accessToken);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((s) => s.accessToken);
  return token ? <Navigate to="/" replace /> : <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        </Route>
        <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index            element={<DashboardPage />} />
          <Route path="/entries"  element={<EntriesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
