import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';

import { Spinner } from '@/components/ui';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import HomeButton from '@/components/auth/HomeButton';
import { localizedApiError } from '@/utils';

interface FormData { name: string; email: string; password: string; }

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const reg = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(t('Account created! Default categories seeded.'));
        navigate(data.user.userType === 'admin' ? '/admin' : '/dashboard');
    },
    onError: (e: unknown) => toast.error(localizedApiError(e, t, 'Registration failed')),
  });

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <p className="font-display text-3xl font-bold">{t('Create account')}</p>
        <p className="text-ink/50 text-sm mt-1">{t('Start tracking your finances with abmiti')}</p>
      </div>

      <form onSubmit={handleSubmit((d) => reg.mutate(d))} className="space-y-4">
        <div>
          <label className="label">{t('Full Name')}</label>
          <input {...register('name', { required: t('Name is required') })}
            placeholder={t('Your name')} className="input" />
          {errors.name && <p className="text-xs text-terra mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label">{t('email')}</label>
          <input {...register('email', { required: t('Email is required') })}
            type="email" placeholder={t('you@example.com')} className="input" />
          {errors.email && <p className="text-xs text-terra mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">{t('password')}</label>
          <input {...register('password', { required: t('Password is required'), minLength: { value: 6, message: t('Min 6 characters') } })}
            type="password" placeholder={t('Min 6 characters')} className="input" />
          {errors.password && <p className="text-xs text-terra mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={reg.isPending}
          className="btn-primary w-full mt-2 py-3">
          {reg.isPending ? <Spinner /> : t('Create Account')}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-paper-mist2"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-paper text-ink/40">{t('Or')}</span>
        </div>
      </div>

      <GoogleAuthButton />
      <HomeButton />

      <p className="text-center text-sm text-ink/50 mt-6">
        {t('Already have an account?')}{' '}
        <Link to="/login" className="text-terra font-semibold hover:underline">
          {t('Sign In')}
        </Link>
      </p>
    </div>
  );
}
