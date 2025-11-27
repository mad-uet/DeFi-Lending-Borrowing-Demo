'use client';

import { useEffect, useState } from 'react';
import { Notification, NotificationType } from '@/hooks/useNotifications';

interface AnimatedToastProps {
  notification: Notification;
  onClose: () => void;
  onRead: () => void;
}

const iconMap: Record<NotificationType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
  liquidation: '🔥',
};

const colorMap: Record<NotificationType, { bg: string; border: string; icon: string; text: string }> = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-700',
    icon: 'bg-green-500 text-white',
    text: 'text-green-800 dark:text-green-200',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-700',
    icon: 'bg-red-500 text-white',
    text: 'text-red-800 dark:text-red-200',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    border: 'border-yellow-200 dark:border-yellow-700',
    icon: 'bg-yellow-500 text-white',
    text: 'text-yellow-800 dark:text-yellow-200',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-700',
    icon: 'bg-blue-500 text-white',
    text: 'text-blue-800 dark:text-blue-200',
  },
  liquidation: {
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    border: 'border-orange-200 dark:border-orange-700',
    icon: 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
    text: 'text-orange-800 dark:text-orange-200',
  },
};

export default function AnimatedToast({ notification, onClose, onRead }: AnimatedToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const colors = colorMap[notification.type];
  const icon = iconMap[notification.type];

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
    onRead();
  }, [onRead]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${notification.type === 'liquidation' ? 'animate-pulse-slow' : ''}
      `}
    >
      <div
        className={`
          relative overflow-hidden rounded-xl shadow-lg border-2
          ${colors.bg} ${colors.border}
          max-w-sm w-full p-4
          ${notification.type === 'liquidation' ? 'ring-2 ring-orange-400 ring-opacity-50' : ''}
        `}
      >
        {/* Progress bar for auto-close */}
        {notification.autoClose && (
          <div
            className={`absolute bottom-0 left-0 h-1 ${colors.icon} opacity-50`}
            style={{
              animation: `shrink ${notification.duration || 5000}ms linear forwards`,
            }}
          />
        )}

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`
              flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
              ${colors.icon}
              ${notification.type === 'liquidation' ? 'animate-bounce-subtle' : ''}
              transition-transform hover:scale-110
            `}
          >
            <span className="text-lg font-bold">{icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className={`font-semibold ${colors.text} truncate`}>
                {notification.title}
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                {formatTime(notification.timestamp)}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {notification.message}
            </p>

            {/* Transaction hash link */}
            {notification.txHash && (
              <a
                href={`#tx-${notification.txHash}`}
                className="inline-flex items-center gap-1 mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                <span>View Transaction</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            {/* Action button */}
            {notification.action && (
              <button
                onClick={notification.action.onClick}
                className={`
                  mt-2 px-3 py-1 text-sm font-medium rounded-lg
                  ${colors.icon} hover:opacity-90 transition-opacity
                `}
              >
                {notification.action.label}
              </button>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
