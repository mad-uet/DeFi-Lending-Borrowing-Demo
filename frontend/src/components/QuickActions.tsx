'use client';

import { useState } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import { useUserAccountData } from '@/hooks/useUserAccountData';
import { useEducationalMode } from '@/hooks/useEducationalMode';

interface QuickActionProps {
  label: string;
  icon: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  variant: 'primary' | 'secondary' | 'success' | 'warning';
  badge?: string;
}

const variantStyles = {
  primary: {
    bg: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    text: 'text-white',
    shadow: 'hover:shadow-blue-500/25',
  },
  secondary: {
    bg: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    text: 'text-white',
    shadow: 'hover:shadow-purple-500/25',
  },
  success: {
    bg: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    text: 'text-white',
    shadow: 'hover:shadow-green-500/25',
  },
  warning: {
    bg: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
    text: 'text-white',
    shadow: 'hover:shadow-amber-500/25',
  },
};

function QuickActionButton({ label, icon, description, onClick, disabled, variant, badge }: QuickActionProps) {
  const styles = variantStyles[variant];
  const { isEnabled: isEducationalMode } = useEducationalMode();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${styles.shadow} ${styles.bg} ${styles.text} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none`}
    >
      {badge && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
          {badge}
        </div>
      )}
      
      <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{icon}</span>
      <span className="font-semibold text-sm">{label}</span>
      
      {isEducationalMode && (
        <span className="text-xs opacity-80 mt-1 text-center line-clamp-2">
          {description}
        </span>
      )}
    </button>
  );
}

interface QuickActionsProps {
  onSupply?: () => void;
  onBorrow?: () => void;
  onRepay?: () => void;
  onWithdraw?: () => void;
}

export default function QuickActions({ onSupply, onBorrow, onRepay, onWithdraw }: QuickActionsProps) {
  const { isConnected } = useWeb3();
  const { accountData } = useUserAccountData();
  const { isEnabled: isEducationalMode } = useEducationalMode();
  
  const { totalCollateralUSD, totalBorrowsUSD, healthFactor } = accountData;
  
  // Determine which actions should be highlighted
  const hasCollateral = totalCollateralUSD > 0;
  const hasBorrows = totalBorrowsUSD > 0;
  const isAtRisk = healthFactor < 1.5 && isFinite(healthFactor);

  if (!isConnected) {
    return null;
  }

  const actions: QuickActionProps[] = [
    {
      label: 'Supply',
      icon: '📥',
      description: 'Deposit assets to earn interest and use as collateral',
      onClick: onSupply || (() => {}),
      variant: 'success',
      disabled: !onSupply,
    },
    {
      label: 'Borrow',
      icon: '💰',
      description: 'Borrow against your collateral at competitive rates',
      onClick: onBorrow || (() => {}),
      variant: 'secondary',
      disabled: !onBorrow || !hasCollateral,
    },
    {
      label: 'Repay',
      icon: '✅',
      description: 'Pay back your loans to reduce interest and improve health',
      onClick: onRepay || (() => {}),
      variant: 'primary',
      disabled: !onRepay || !hasBorrows,
      badge: isAtRisk ? '!' : undefined,
    },
    {
      label: 'Withdraw',
      icon: '📤',
      description: 'Remove your supplied assets from the protocol',
      onClick: onWithdraw || (() => {}),
      variant: 'warning',
      disabled: !onWithdraw || !hasCollateral,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span>⚡</span> Quick Actions
        </h3>
        {isEducationalMode && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Click to start
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <QuickActionButton key={action.label} {...action} />
        ))}
      </div>

      {/* Educational hint for beginners */}
      {isEducationalMode && !hasCollateral && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <span>💡</span>
            <span>
              <strong>Start here:</strong> Supply assets first to begin earning interest 
              and unlock borrowing capabilities.
            </span>
          </p>
        </div>
      )}

      {/* Warning for at-risk positions */}
      {isAtRisk && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 animate-pulse">
          <p className="text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <span>⚠️</span>
            <span>
              <strong>Action needed:</strong> Your health factor is low. Consider repaying 
              some debt or adding more collateral.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

// Compact inline actions
export function InlineQuickActions({ onAction }: { onAction?: (type: string) => void }) {
  const { accountData } = useUserAccountData();
  const hasCollateral = accountData.totalCollateralUSD > 0;
  const hasBorrows = accountData.totalBorrowsUSD > 0;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onAction?.('supply')}
        className="px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
      >
        📥 Supply
      </button>
      <button
        onClick={() => onAction?.('borrow')}
        disabled={!hasCollateral}
        className="px-3 py-1.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        💰 Borrow
      </button>
      {hasBorrows && (
        <button
          onClick={() => onAction?.('repay')}
          className="px-3 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        >
          ✅ Repay
        </button>
      )}
    </div>
  );
}
