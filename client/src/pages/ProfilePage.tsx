import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { PageHeader } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { Save } from 'lucide-react';

const MINECRAFT_AVATARS = [
  '🧱', '⛏️', '🗡️', '🛡️', '🏹', '🪓', '🔱', '🎣',
  '🌳', '🔥', '💎', '🪨', '🌾', '🍖', '🍞', '🥕',
  '🐷', '🐮', '🐔', '🐑', '🐴', '🐺', '🦊', '🐝',
  '⚡', '🌙', '⭐', '🌈', '☀️', '🌊', '🏔️', '🏰',
  '🧙', '🧚', '👑', '💀', '🎃', '🕷️', '🦇', '🐉',
  '🎮', '🎯', '🎲', '🎨', '🎭', '🎪', '🎸', '🎺',
];

interface ProfileFormData {
  name: string;
  avatar: string;
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '🧱');

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      avatar: user?.avatar || '🧱',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiClient.patch('/auth/me', data);
      return response.data;
    },
    onSuccess: (data) => {
      setUser({ ...user!, name: data.data.name, avatar: data.data.avatar });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const onSubmit = handleSubmit((data) => {
    updateProfileMutation.mutate({ ...data, avatar: selectedAvatar });
  });

  return (
    <div className="min-h-full">
      <PageHeader
        title={t('Profile') || 'Profile'}
        subtitle={t('profileSubtitle') || 'Manage your account settings and avatar'}
      />

      <div className="px-4 md:px-8 pb-10 space-y-6">
        {/* Profile Card */}
        <div className="max-w-2xl mx-auto">
          <div className="card p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 rounded-full bg-sage/10 border-4 border-sage/20 flex items-center justify-center text-5xl mb-4">
                {selectedAvatar}
              </div>
              <h2 className="font-display text-2xl font-bold text-ink">{user?.name}</h2>
              <p className="text-ink/50 text-sm">{user?.email}</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="label">{t('Name') || 'Name'}</label>
                <input
                  {...register('name', {
                    required: 'Name is required',
                    minLength: { value: 1, message: 'Name must be at least 1 character' },
                    maxLength: { value: 80, message: 'Name must be less than 80 characters' },
                  })}
                  type="text"
                  className="input"
                  placeholder="Enter your name"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="label">{t('Avatar') || 'Choose Your Avatar'}</label>
                <p className="text-xs text-ink/50 mb-3">Select a Minecraft-style avatar</p>

                <div className="grid grid-cols-8 md:grid-cols-12 gap-2 p-4 bg-paper-mist rounded-xl max-h-64 overflow-y-auto">
                  {MINECRAFT_AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all hover:scale-110 ${
                        selectedAvatar === avatar
                          ? 'bg-terra ring-2 ring-terra shadow-lg scale-110'
                          : 'bg-white hover:bg-paper-mist2'
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="btn-primary flex-1"
                >
                  <Save size={14} />
                  {updateProfileMutation.isPending ? 'Saving...' : t('SaveChanges') || 'Save Changes'}
                </button>
              </div>

              {/* Success/Error Messages */}
              {updateProfileMutation.isSuccess && (
                <div className="bg-sage/10 border border-sage/20 text-sage px-4 py-3 rounded-lg text-sm animate-fade-in">
                  ✓ Profile updated successfully!
                </div>
              )}
              {updateProfileMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm animate-fade-in">
                  ✗ Failed to update profile. Please try again.
                </div>
              )}
            </form>
          </div>

          {/* Account Info */}
          <div className="card p-6 mt-4">
            <h3 className="font-display font-bold text-lg mb-4">{t('AccountInfo') || 'Account Information'}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink/60">{t('Email') || 'Email'}</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">{t('UserID') || 'User ID'}</span>
                <span className="font-mono text-xs text-ink/80">{user?._id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
