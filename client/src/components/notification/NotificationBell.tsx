import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Trash2, X, Info, Check, Clock } from 'lucide-react';
import { siteApi } from '@/api/site.api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { cx } from '@/utils';

export function NotificationBell({ className }: { className?: string }) {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await siteApi.notifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // silently handle background errors
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Poll periodically for new notifications every 45s
    const timer = setInterval(fetchNotifications, 45000);
    return () => clearInterval(timer);
  }, [user]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const userId = user?._id ?? user?.id;

  const isRead = (n: any) => {
    if (!userId) return false;
    const readBy = Array.isArray(n.readBy)
      ? n.readBy
      : Array.isArray(n.read_by)
      ? n.read_by
      : typeof n.read_by === 'string'
      ? JSON.parse(n.read_by || '[]')
      : [];
    return readBy.includes(userId);
  };

  const unreadCount = notifications.filter((n) => !isRead(n)).length;

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await siteApi.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => {
          const nid = n.id ?? n._id;
          if (nid === id) {
            const currentRead = Array.isArray(n.readBy)
              ? [...n.readBy]
              : Array.isArray(n.read_by)
              ? [...n.read_by]
              : [];
            if (userId && !currentRead.includes(userId)) currentRead.push(userId);
            return { ...n, readBy: currentRead, read_by: currentRead };
          }
          return n;
        })
      );
    } catch {
      toast.error('Could not mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setLoading(true);
    try {
      await siteApi.markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => {
          const currentRead = Array.isArray(n.readBy)
            ? [...n.readBy]
            : Array.isArray(n.read_by)
            ? [...n.read_by]
            : [];
          if (userId && !currentRead.includes(userId)) currentRead.push(userId);
          return { ...n, readBy: currentRead, read_by: currentRead };
        })
      );
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await siteApi.clearNotification(id);
      setNotifications((prev) => prev.filter((n) => (n.id ?? n._id) !== id));
      toast.success('Notification cleared');
    } catch {
      toast.error('Could not clear notification');
    }
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm('Clear all notifications?')) return;
    setLoading(true);
    try {
      await siteApi.clearAllNotifications();
      setNotifications([]);
      toast.success('All notifications cleared');
    } catch {
      toast.error('Could not clear notifications');
    } finally {
      setLoading(false);
    }
  };

  const displayedNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !isRead(n);
    return true;
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  return (
    <div className={cx('relative inline-block', className)} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label="Notifications"
        className="relative w-8 h-8 rounded-full bg-terra/10 hover:bg-terra/20 text-terra flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-terra/30"
      >
        <Bell size={15} className={unreadCount > 0 ? 'animate-bounce-subtle' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-terra text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-lift border border-paper-mist2 z-50 overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="p-4 border-b border-paper-mist2 bg-paper/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base text-ink">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-terra/10 text-terra rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={loading}
                    title="Mark all as read"
                    className="p-1.5 text-xs text-ink/60 hover:text-terra hover:bg-paper-mist rounded-lg transition-colors flex items-center gap-1"
                  >
                    <CheckCheck size={14} />
                    <span className="hidden sm:inline text-[11px]">Mark all read</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    disabled={loading}
                    title="Clear all"
                    className="p-1.5 text-xs text-ink/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-ink/40 hover:text-ink hover:bg-paper-mist rounded-lg transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => setFilter('all')}
                className={cx(
                  'px-3 py-1 text-xs font-semibold rounded-lg transition-colors',
                  filter === 'all'
                    ? 'bg-ink text-white'
                    : 'text-ink/60 hover:text-ink hover:bg-paper-mist'
                )}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={cx(
                  'px-3 py-1 text-xs font-semibold rounded-lg transition-colors',
                  filter === 'unread'
                    ? 'bg-terra text-white'
                    : 'text-ink/60 hover:text-ink hover:bg-paper-mist'
                )}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-paper-mist2/60">
            {displayedNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-paper-mist flex items-center justify-center text-ink/30 mx-auto mb-3">
                  <Bell size={20} />
                </div>
                <p className="text-sm font-semibold text-ink/70">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-xs text-ink/40 mt-1">
                  {filter === 'unread' ? "You're all caught up!" : 'When you receive updates, they will appear here.'}
                </p>
              </div>
            ) : (
              displayedNotifications.map((n) => {
                const nid = n.id ?? n._id ?? '';
                const read = isRead(n);
                const date = n.createdAt ?? n.created_at;

                return (
                  <div
                    key={nid}
                    onClick={() => {
                      if (!read) handleMarkAsRead(nid);
                    }}
                    className={cx(
                      'p-3.5 sm:p-4 transition-all duration-150 relative group cursor-pointer hover:bg-paper-mist/50',
                      !read ? 'bg-terra/[0.03]' : 'bg-white'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon / Unread dot */}
                      <div className="relative shrink-0 mt-0.5">
                        <div
                          className={cx(
                            'w-8 h-8 rounded-xl flex items-center justify-center',
                            !read
                              ? 'bg-terra/10 text-terra'
                              : 'bg-paper-mist text-ink/40'
                          )}
                        >
                          <Info size={15} />
                        </div>
                        {!read && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-terra rounded-full ring-2 ring-white" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4
                            className={cx(
                              'text-xs sm:text-sm font-semibold truncate',
                              !read ? 'text-ink font-bold' : 'text-ink/80'
                            )}
                          >
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-ink/40 whitespace-nowrap flex items-center gap-1 shrink-0">
                            <Clock size={10} />
                            {formatDate(date)}
                          </span>
                        </div>
                        <p className="text-xs text-ink/60 leading-relaxed break-words whitespace-pre-wrap">
                          {n.message}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 mt-2 pt-1 border-t border-paper-mist2/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!read && (
                            <button
                              onClick={(e) => handleMarkAsRead(nid, e)}
                              className="text-[11px] font-medium text-terra hover:underline flex items-center gap-1"
                            >
                              <Check size={12} />
                              Mark read
                            </button>
                          )}
                          <button
                            onClick={(e) => handleClear(nid, e)}
                            className="text-[11px] font-medium text-ink/40 hover:text-red-500 flex items-center gap-1"
                          >
                            <Trash2 size={12} />
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2.5 bg-paper-mist/40 border-t border-paper-mist2 text-center">
              <span className="text-[11px] text-ink/40">
                {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
