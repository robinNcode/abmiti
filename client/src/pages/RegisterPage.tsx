import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';

import { Spinner } from '@/components/ui';

interface FormData { name: string; email: string; password: string; }

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const reg = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('Account created! Default categories seeded.');
      navigate('/');
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Registration failed';
      toast.error(msg);
    },
  });

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <p className="font-display text-3xl font-bold">Create account</p>
        <p className="text-ink/50 text-sm mt-1">Start tracking your finances with abmiti</p>
      </div>

      <form onSubmit={handleSubmit((d) => reg.mutate(d))} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input {...register('name', { required: 'Name is required' })}
            placeholder="Your name" className="input" />
          {errors.name && <p className="text-xs text-terra mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label">Email</label>
          <input {...register('email', { required: 'Email is required' })}
            type="email" placeholder="you@example.com" className="input" />
          {errors.email && <p className="text-xs text-terra mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Password</label>
          <input {...register('password', { required: true, minLength: { value: 6, message: 'Min 6 characters' } })}
            type="password" placeholder="Min 6 characters" className="input" />
          {errors.password && <p className="text-xs text-terra mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={reg.isPending}
          className="btn-primary w-full mt-2 py-3">
          {reg.isPending ? <Spinner /> : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-ink/50 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-terra font-semibold hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
