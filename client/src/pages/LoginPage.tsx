import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import { Spinner } from '@/components/ui';

interface FormData { email: string; password: string; }

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Login failed';
      toast.error(msg);
    },
  });

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <p className="font-display text-3xl font-bold">Welcome back</p>
        <p className="text-ink/50 text-sm mt-1">Sign in to your abmiti account</p>
      </div>

      <form onSubmit={handleSubmit((d) => login.mutate(d))} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input {...register('email', { required: 'Email is required' })}
            type="email" placeholder="you@example.com" className="input" />
          {errors.email && <p className="text-xs text-terra mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Password</label>
          <input {...register('password', { required: 'Password is required' })}
            type="password" placeholder="••••••••" className="input" />
          {errors.password && <p className="text-xs text-terra mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={login.isPending}
          className="btn-primary w-full mt-2 py-3">
          {login.isPending ? <Spinner /> : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-ink/50 mt-6">
        No account?{' '}
        <Link to="/register" className="text-terra font-semibold hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
