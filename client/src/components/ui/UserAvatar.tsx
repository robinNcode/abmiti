import React from 'react';
import { cx } from '@/utils';

interface UserAvatarProps {
  avatar?: string;
  name?: string;
  className?: string;
  sizeClassName?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  name,
  className = '',
  sizeClassName = 'w-8 h-8 text-sm',
}) => {
  const isUrl = avatar && (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('/'));

  if (isUrl) {
    return (
      <img
        src={avatar}
        alt={name || 'User avatar'}
        referrerPolicy="no-referrer"
        className={cx(
          'rounded-full object-cover shrink-0 border border-terra/20',
          sizeClassName,
          className
        )}
      />
    );
  }

  return (
    <div
      className={cx(
        'rounded-full bg-terra/10 flex items-center justify-center text-terra font-bold shrink-0 overflow-hidden',
        sizeClassName,
        className
      )}
    >
      {avatar || name?.[0]?.toUpperCase() || '👤'}
    </div>
  );
};
