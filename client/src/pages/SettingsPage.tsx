import { useState } from 'react';
import { PageHeader, Spinner } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useUpdateProfile } from '@/hooks';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [budget, setBudget] = useState(user?.budget ?? 0);
  const updateProfile = useUpdateProfile();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await updateProfile.mutateAsync({ budget: Number(budget) || 0 });
  };

  return (
    <div className="min-h-full">
      <PageHeader
        title="Settings"
        subtitle="Set your monthly budget and profile preferences"
      />

      <div className="px-4 md:px-8 pb-10">
        <div className="card p-6 max-w-2xl">
          <h2 className="font-display text-xl font-bold mb-4">Monthly Budget</h2>
          <p className="text-sm text-ink/50 mb-4">
            Your budget helps the dashboard show remaining budget and investment impact.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Monthly budget (BDT)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={budget}
                onChange={(event) => setBudget(Number(event.target.value || 0))}
                className="input w-full"
              />
            </div>

            <button type="submit"
              className="btn-primary"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? <Spinner /> : 'Save Budget'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
