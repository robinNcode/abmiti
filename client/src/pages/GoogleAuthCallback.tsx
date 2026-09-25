import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth.api';
import { Spinner } from '@/components/ui';

export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTokens, setUser } = useAuthStore();

  useEffect(() => {
    const handleAuth = async () => {
      // Check for error in query string
      const params = new URLSearchParams(location.search);
      const error = params.get('error');
      
      if (error) {
        toast.error(error);
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
          toast.success('Successfully logged in with Google');
          navigate('/dashboard');
        } catch (err) {
          toast.error('Failed to retrieve user information');
          navigate('/login');
        }
      } else {
        toast.error('Authentication failed: Missing tokens');
        navigate('/login');
      }
    };

    handleAuth();
  }, [location, navigate, setTokens, setUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-up">
      <Spinner className="w-8 h-8 mb-4 text-terra" />
      <p className="text-ink/60 font-medium">Completing authentication...</p>
    </div>
  );
}
