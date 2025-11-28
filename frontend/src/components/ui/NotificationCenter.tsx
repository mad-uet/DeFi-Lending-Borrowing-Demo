'use client';

import { useState } from 'react';
import { useNotifications, Notification, NotificationType } from '@/hooks/useNotifications';
import AnimatedToast from './AnimatedToast';

const categoryLabels: Record<NotificationType, string> = {
  success: 'Completed',
  error: 'Failed',
  warning: 'Warnings',
  info: 'Info',
  liquidation: 'Liquidations',
};

export default function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const categoryCounts = notifications.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {} as Record<NotificationType, number>);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <svg
          className={`w-6 h-6 transition-transform ${isOpen ? 'scale-110' : ''} ${unreadCount > 0 ? 'animate-wiggle' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full animate-scale-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-slide-down">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-1 mt-3 overflow-x-auto">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    filter === 'all'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                  }`}
                >
                  All ({notifications.length})
                </button>
                {Object.entries(categoryLabels).map(([type, label]) => {
                  const count = categoryCounts[type as NotificationType] || 0;
                  if (count === 0) return null;
                  return (
                    <button
                      key={type}
                      onClick={() => setFilter(type as NotificationType)}
                      className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                        filter === type
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                      }`}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[50vh]">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="font-medium">No notifications</p>
                  <p className="text-sm mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClose={() => removeNotification(notification.id)}
                      onRead={() => markAsRead(notification.id)}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
  onRead: () => void;
  formatTime: (timestamp: number) => string;
}

function NotificationItem({ notification, onClose, onRead, formatTime }: NotificationItemProps) {
  const typeColors: Record<NotificationType, string> = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
    liquidation: 'bg-gradient-to-r from-orange-500 to-red-500',
  };

  const typeIcons: Record<NotificationType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
    liquidation: '🔥',
  };

  return (
    <div
      className={`
        p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer
        ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}
      `}
      onClick={onRead}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${typeColors[notification.type]}`}>
          {typeIcons[notification.type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`font-medium text-sm truncate ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
              {notification.title}
            </h4>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatTime(notification.timestamp)}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
        </div>

        {/* Unread indicator */}
        {!notification.read && (
          <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
        )}

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Toast Container for floating notifications
export function ToastContainer() {
  const { notifications, removeNotification, markAsRead } = useNotifications();

  // Only show recent notifications that haven't been dismissed
  const recentNotifications = notifications
    .filter(n => Date.now() - n.timestamp < (n.duration || 5000) + 500)
    .slice(0, 5);

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3">
      {recentNotifications.map((notification) => (
        <AnimatedToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
          onRead={() => markAsRead(notification.id)}
        />
      ))}
    </div>
  );
}
