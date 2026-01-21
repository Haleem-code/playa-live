'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Loader2, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { notificationService } from '@/services';
import type { Notification } from '@/types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function HeaderNotifications() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Poll for unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationService.getNotifications({ limit: 10, skip: 0 });
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => (n._id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    setSelectedNotification(notification);
  };

  const handleViewStream = async () => {
    if (!selectedNotification) return;

    // Mark as read
    if (!selectedNotification.read) {
      await handleMarkAsRead(selectedNotification._id);
    }

    // Navigate to stream
    if (selectedNotification.data?.streamId) {
      router.push(`/stream/${selectedNotification.data.streamId}`);
      setIsOpen(false);
      setSelectedNotification(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'stream_created':
      case 'stream_started':
        return '🎮';
      case 'stream_ended':
        return '🏁';
      case 'bet_won':
        return '🎉';
      case 'bet_lost':
        return '😢';
      default:
        return '📢';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-zinc-800 rounded-full transition-colors group"
      >
        <Bell className="w-5 h-5 text-zinc-400 group-hover:text-white" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-[#0a0a0a]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="fixed inset-x-4 top-20 md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-96 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl z-50 max-h-[80vh] md:max-h-[600px] flex flex-col ring-1 ring-black/5">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-zinc-900/50 rounded-t-xl">
            <h3 className="font-bold text-white text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No new notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors text-left group ${
                    !notification.read ? 'bg-blue-500/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="text-xl flex-shrink-0 mt-0.5 grayscale group-hover:grayscale-0 transition-all">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className={`text-sm truncate ${!notification.read ? 'text-white font-semibold' : 'text-zinc-300 font-medium'}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-zinc-400 text-xs line-clamp-2 mb-1 group-hover:text-zinc-300 transition-colors">
                        {notification.message}
                      </p>
                      <p className="text-zinc-500 text-[10px]">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Mark as read button */}
                    {!notification.read && (
                      <button
                        onClick={(e) => handleMarkAsRead(notification._id, e)}
                        className="p-1 hover:bg-zinc-700 rounded transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3 text-zinc-400" />
                      </button>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-white/5 bg-zinc-900/50 rounded-b-xl">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/notifications');
                }}
                className="text-xs font-medium text-zinc-400 hover:text-white w-full text-center py-1 transition-colors"
              >
                View all history
              </button>
            </div>
          )}
        </div>
      )}

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedNotification(null)}
          />

          {/* Modal */}
          <div className="relative bg-[#18181b] border border-white/10 rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-3">
                <span className="text-2xl">{getNotificationIcon(selectedNotification.type)}</span>
                {selectedNotification.title}
              </h2>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <p className="text-zinc-300 leading-relaxed">{selectedNotification.message}</p>

              {/* Stream Details */}
              {selectedNotification.data && (
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 space-y-2 text-sm">
                  {selectedNotification.data.streamTitle && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Stream</span>
                      <span className="text-white font-medium text-right">{selectedNotification.data.streamTitle}</span>
                    </div>
                  )}
                  {selectedNotification.data.player1Name && selectedNotification.data.player2Name && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Match</span>
                      <span className="text-white font-medium text-right">
                        {selectedNotification.data.player1Name} <span className="text-zinc-600">vs</span> {selectedNotification.data.player2Name}
                      </span>
                    </div>
                  )}
                  {selectedNotification.data.creatorUsername && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Creator</span>
                      <span className="text-white font-medium text-right">{selectedNotification.data.creatorUsername}</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-zinc-500 text-xs flex items-center gap-1">
                Received {formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-5 border-t border-white/5 bg-zinc-900/30 rounded-b-xl">
              <button
                onClick={() => setSelectedNotification(null)}
                className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Close
              </button>
              {selectedNotification.data?.streamId && (
                <button
                  onClick={handleViewStream}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors text-sm shadow-lg shadow-blue-900/20"
                >
                  View Stream
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
