'use client';

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'liquidation';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  txHash?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoClose?: boolean;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ): string => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      read: false,
      autoClose: notification.autoClose ?? true,
      duration: notification.duration ?? 5000,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep max 50

    // Auto-remove if autoClose is true
    if (newNotification.autoClose) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Convenience hooks for specific notification types
export function useTransactionNotifications() {
  const { addNotification } = useNotifications();

  const notifyTransactionStart = useCallback((action: string, asset: string) => {
    return addNotification({
      type: 'info',
      title: `${action} Started`,
      message: `${action} ${asset} transaction initiated...`,
      autoClose: false,
    });
  }, [addNotification]);

  const notifyTransactionSuccess = useCallback((
    action: string,
    asset: string,
    amount: string,
    txHash?: string
  ) => {
    return addNotification({
      type: 'success',
      title: `${action} Successful`,
      message: `Successfully ${action.toLowerCase()}ed ${amount} ${asset}`,
      txHash,
      duration: 8000,
    });
  }, [addNotification]);

  const notifyTransactionError = useCallback((action: string, error: string) => {
    return addNotification({
      type: 'error',
      title: `${action} Failed`,
      message: error,
      duration: 10000,
    });
  }, [addNotification]);

  const notifyLiquidationRisk = useCallback((healthFactor: number) => {
    return addNotification({
      type: 'liquidation',
      title: '⚠️ Liquidation Risk',
      message: `Your health factor is ${healthFactor.toFixed(2)}. Add collateral or repay debt to avoid liquidation.`,
      autoClose: false,
    });
  }, [addNotification]);

  const notifyLiquidationEvent = useCallback((asset: string, amount: string) => {
    return addNotification({
      type: 'liquidation',
      title: '🚨 Liquidation Occurred',
      message: `${amount} ${asset} was liquidated from your position. Your debt has been reduced accordingly.`,
      autoClose: false,
    });
  }, [addNotification]);

  return {
    notifyTransactionStart,
    notifyTransactionSuccess,
    notifyTransactionError,
    notifyLiquidationRisk,
    notifyLiquidationEvent,
  };
}
