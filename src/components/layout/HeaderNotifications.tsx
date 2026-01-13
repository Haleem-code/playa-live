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
        className="relative p-2 hover:bg-slate-700 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full px-4 py-3 border-b border-slate-700 hover:bg-slate-700 transition-colors text-left ${
                    !notification.read ? 'bg-slate-750' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="text-2xl flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-white text-sm truncate">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                        )}
                      </div>
                      <p className="text-slate-300 text-sm line-clamp-2 mb-1">
                        {notification.message}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Mark as read button */}
                    {!notification.read && (
                      <button
                        onClick={(e) => handleMarkAsRead(notification._id, e)}
                        className="p-1 hover:bg-slate-600 rounded transition-colors flex-shrink-0"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-700">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/notifications');
                }}
                className="text-sm text-blue-400 hover:text-blue-300 w-full text-center"
              >
                View all notifications
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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedNotification(null)}
          />

          {/* Modal */}
          <div className="relative bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-2xl">{getNotificationIcon(selectedNotification.type)}</span>
                {selectedNotification.title}
              </h2>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-slate-300">{selectedNotification.message}</p>

              {/* Stream Details */}
              {selectedNotification.data && (
                <div className="bg-slate-800 rounded-lg p-4 space-y-2 text-sm">
                  {selectedNotification.data.streamTitle && (
                    <div>
                      <span className="text-slate-400">Stream:</span>
                      <span className="text-white ml-2">{selectedNotification.data.streamTitle}</span>
                    </div>
                  )}
                  {selectedNotification.data.player1Name && selectedNotification.data.player2Name && (
                    <div>
                      <span className="text-slate-400">Match:</span>
                      <span className="text-white ml-2">
                        {selectedNotification.data.player1Name} vs {selectedNotification.data.player2Name}
                      </span>
                    </div>
                  )}
                  {selectedNotification.data.creatorUsername && (
                    <div>
                      <span className="text-slate-400">Creator:</span>
                      <span className="text-white ml-2">{selectedNotification.data.creatorUsername}</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-slate-500 text-xs">
                {formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 p-6 border-t border-slate-700">
              <button
                onClick={() => setSelectedNotification(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              >
                Close
              </button>
              {selectedNotification.data?.streamId && (
                <button
                  onClick={handleViewStream}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
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
