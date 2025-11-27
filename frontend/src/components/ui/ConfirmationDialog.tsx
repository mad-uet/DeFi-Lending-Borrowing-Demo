'use client';

import { useState, useEffect, useCallback } from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'warning' | 'danger';
  requireAcknowledgment?: boolean;
  acknowledgmentText?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  requireAcknowledgment = false,
  acknowledgmentText = 'I understand and accept the risks',
  showIcon = true,
  children,
}: ConfirmationDialogProps) {
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Handle animation on open/close
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimatingOut(false);
      setIsAcknowledged(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 200);
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    if (requireAcknowledgment && !isAcknowledged) return;
    onConfirm();
    handleClose();
  }, [requireAcknowledgment, isAcknowledged, onConfirm, handleClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleClose]);

  if (!isVisible) return null;

  const variantStyles = {
    default: {
      icon: '❓',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      buttonBg: 'bg-blue-500 hover:bg-blue-600',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    warning: {
      icon: '⚠️',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      buttonBg: 'bg-amber-500 hover:bg-amber-600',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
    danger: {
      icon: '🚨',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      buttonBg: 'bg-red-500 hover:bg-red-600',
      borderColor: 'border-red-200 dark:border-red-800',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isAnimatingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div 
        className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-200 ${
          isAnimatingOut ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 pt-6 pb-4 border-b ${styles.borderColor}`}>
          <div className="flex items-center gap-3">
            {showIcon && (
              <div className={`w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center text-2xl ${styles.iconColor}`}>
                {styles.icon}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <div className="text-gray-600 dark:text-gray-300">
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>

          {children && (
            <div className="mt-4">
              {children}
            </div>
          )}

          {/* Acknowledgment checkbox */}
          {requireAcknowledgment && (
            <label className={`flex items-start gap-3 mt-4 p-3 rounded-lg cursor-pointer transition-colors ${
              variant === 'danger' 
                ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30' 
                : variant === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}>
              <input
                type="checkbox"
                checked={isAcknowledged}
                onChange={(e) => setIsAcknowledged(e.target.checked)}
                className={`mt-0.5 w-5 h-5 rounded ${
                  variant === 'danger' 
                    ? 'border-red-300 text-red-600 focus:ring-red-500' 
                    : variant === 'warning'
                      ? 'border-amber-300 text-amber-600 focus:ring-amber-500'
                      : 'border-gray-300 text-blue-600 focus:ring-blue-500'
                }`}
              />
              <span className={`text-sm ${
                variant === 'danger' 
                  ? 'text-red-800 dark:text-red-200' 
                  : variant === 'warning'
                    ? 'text-amber-800 dark:text-amber-200'
                    : 'text-gray-700 dark:text-gray-300'
              }`}>
                {acknowledgmentText}
              </span>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={requireAcknowledgment && !isAcknowledged}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all transform ${styles.buttonBg} disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none hover:scale-[1.02] active:scale-[0.98]`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Transaction confirmation specifically
interface TransactionConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'deposit' | 'withdraw' | 'borrow' | 'repay';
  amount: string;
  symbol: string;
  healthFactorImpact?: {
    before: number;
    after: number;
  };
  gasEstimate?: string;
}

export function TransactionConfirmation({
  isOpen,
  onClose,
  onConfirm,
  type,
  amount,
  symbol,
  healthFactorImpact,
  gasEstimate,
}: TransactionConfirmationProps) {
  const typeLabels = {
    deposit: { title: 'Confirm Deposit', emoji: '📥', action: 'deposit' },
    withdraw: { title: 'Confirm Withdrawal', emoji: '📤', action: 'withdraw' },
    borrow: { title: 'Confirm Borrow', emoji: '💰', action: 'borrow' },
    repay: { title: 'Confirm Repayment', emoji: '💳', action: 'repay' },
  };

  const config = typeLabels[type];
  const isRisky = healthFactorImpact && healthFactorImpact.after < 1.5;
  const isVeryRisky = healthFactorImpact && healthFactorImpact.after < 1.2;

  const variant = isVeryRisky ? 'danger' : isRisky ? 'warning' : 'default';

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={config.title}
      message={
        <div className="space-y-3">
          <p>
            You are about to {config.action}{' '}
            <span className="font-semibold">{amount} {symbol}</span>
          </p>
          
          {healthFactorImpact && (
            <div className={`p-3 rounded-lg ${
              isVeryRisky 
                ? 'bg-red-50 dark:bg-red-900/20' 
                : isRisky 
                  ? 'bg-amber-50 dark:bg-amber-900/20'
                  : 'bg-gray-50 dark:bg-gray-700'
            }`}>
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Health Factor: </span>
                <span className={healthFactorImpact.before > 1.5 ? 'text-green-600' : healthFactorImpact.before > 1.2 ? 'text-amber-600' : 'text-red-600'}>
                  {healthFactorImpact.before.toFixed(2)}
                </span>
                <span className="mx-2">→</span>
                <span className={healthFactorImpact.after > 1.5 ? 'text-green-600' : healthFactorImpact.after > 1.2 ? 'text-amber-600' : 'text-red-600'}>
                  {healthFactorImpact.after.toFixed(2)}
                </span>
              </div>
              {isVeryRisky && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  ⚠️ This transaction puts your position at high liquidation risk!
                </p>
              )}
            </div>
          )}

          {gasEstimate && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Estimated gas: {gasEstimate}
            </div>
          )}
        </div>
      }
      confirmText={`${config.emoji} ${config.title.replace('Confirm ', '')}`}
      variant={variant}
      requireAcknowledgment={isRisky}
      acknowledgmentText={
        isVeryRisky 
          ? 'I understand this puts my position at high liquidation risk'
          : 'I understand the risks of this transaction'
      }
    />
  );
}

// Simple action confirmation
interface ActionConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: string;
  description?: string;
}

export function ActionConfirmation({
  isOpen,
  onClose,
  onConfirm,
  action,
  description,
}: ActionConfirmationProps) {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Confirm ${action}`}
      message={description || `Are you sure you want to ${action.toLowerCase()}?`}
      confirmText={action}
      variant="default"
    />
  );
}
