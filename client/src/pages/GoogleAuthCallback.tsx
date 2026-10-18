import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth.api';
import { Spinner } from '@/components/ui';

export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTokens, setUser } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    const handleAuth = async () => {
      // Check for error in query string
      const params = new URLSearchParams(location.search);
      const error = params.get('error');
      
      if (error) {
        toast.error(t(error, { defaultValue: t('Authentication failed') }));
        navigate('/login');
        return;
      }

      // Check for tokens in the hash
      const hash = location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('accessToken');
      const refreshToken = hashParams.get('refreshToken');

      if (accessToken && refreshToken) {
        setTokens(accessToken, refreshToken);
        
        try {
          // Fetch user info since we just have the tokens
          const user = await authApi.me();
          setUser(user);
          toast.success(t('Successfully logged in with Google'));
          navigate(user.userType === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
          toast.error(t('Failed to retrieve user information'));
          navigate('/login');
        }
      } else {
        toast.error(t('Authentication failed: Missing tokens'));
        navigate('/login');
      }
    };

    handleAuth();
  }, [location, navigate, setTokens, setUser, t]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-up">
      <Spinner className="w-8 h-8 mb-4 text-terra" />
      <p className="text-ink/60 font-medium">{t('Completing authentication...')}</p>
    </div>
  );
}
