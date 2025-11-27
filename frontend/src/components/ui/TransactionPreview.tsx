'use client';

import { ReactNode } from 'react';
import HealthFactorGauge from './HealthFactorGauge';
import BalanceChangePreview, { calculateBalanceChanges } from './BalanceChangePreview';

interface TransactionPreviewProps {
  type: 'supply' | 'withdraw' | 'borrow' | 'repay';
  amount: string;
  symbol: string;
  decimals: number;
  currentHealthFactor: number;
  newHealthFactor: number;
  currentWalletBalance: string;
  currentPoolBalance: string;
  currentBorrowed?: string;
  gasEstimate?: string;
  children?: ReactNode;
}

export default function TransactionPreview({
  type,
  amount,
  symbol,
  decimals,
  currentHealthFactor,
  newHealthFactor,
  currentWalletBalance,
  currentPoolBalance,
  currentBorrowed,
  gasEstimate,
  children,
}: TransactionPreviewProps) {
  const amountNum = parseFloat(amount) || 0;
  const hasAmount = amountNum > 0;

  const changes = hasAmount
    ? calculateBalanceChanges(type, amount, symbol, currentWalletBalance, currentPoolBalance, currentBorrowed)
    : [];

  const isRisky = newHealthFactor < 1.2 && isFinite(newHealthFactor);
  const isLiquidationRisk = newHealthFactor < 1.0 && isFinite(newHealthFactor);

  const typeLabels = {
    supply: { action: 'Supply', icon: '📥', color: 'text-green-600' },
    withdraw: { action: 'Withdraw', icon: '📤', color: 'text-yellow-600' },
    borrow: { action: 'Borrow', icon: '💰', color: 'text-purple-600' },
    repay: { action: 'Repay', icon: '✅', color: 'text-blue-600' },
  };

  const typeConfig = typeLabels[type];

  if (!hasAmount) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <p className="font-medium">Enter an amount to see preview</p>
        <p className="text-sm mt-1">We'll show you exactly what will happen</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Transaction summary header */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 rounded-xl">
        <div className="flex-shrink-0 w-12 h-12 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-md">
          <span className="text-2xl">{typeConfig.icon}</span>
        </div>
        <div>
          <div className={`font-semibold ${typeConfig.color}`}>
            {typeConfig.action} {amount} {symbol}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Transaction Preview
          </div>
        </div>
      </div>

      {/* Health Factor Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-sm text-gray-500 mb-2">Current</div>
          <HealthFactorGauge
            currentValue={currentHealthFactor}
            size="sm"
            showLabels={false}
          />
          <div className="text-xs text-gray-400 mt-1">Health Factor</div>
        </div>
        <div className={`flex flex-col items-center p-4 rounded-xl transition-all ${
          isLiquidationRisk ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 animate-pulse' :
          isRisky ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700' :
          'bg-gray-50 dark:bg-gray-800'
        }`}>
          <div className="text-sm text-gray-500 mb-2">After Transaction</div>
          <HealthFactorGauge
            currentValue={newHealthFactor}
            size="sm"
            showLabels={false}
          />
          <div className="text-xs text-gray-400 mt-1">New Health Factor</div>
        </div>
      </div>

      {/* Risk Warning */}
      {isLiquidationRisk && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-xl animate-pulse-slow">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">🚨</span>
            </div>
            <div>
              <h4 className="font-bold text-red-800 dark:text-red-200">Liquidation Risk!</h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                This transaction will put your health factor below 1.0. Your position may be immediately liquidated,
                resulting in loss of collateral. Consider borrowing a smaller amount.
              </p>
            </div>
          </div>
        </div>
      )}

      {isRisky && !isLiquidationRisk && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">⚠️</span>
            </div>
            <div>
              <h4 className="font-bold text-yellow-800 dark:text-yellow-200">Low Health Factor Warning</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Your health factor will be below 1.2 after this transaction. Small price movements could 
                put you at liquidation risk. Consider using a smaller amount for safety.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Balance Changes */}
      <BalanceChangePreview changes={changes} />

      {/* Gas Estimate */}
      {gasEstimate && (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Estimated Gas</span>
          </div>
          <span className="font-medium text-gray-900 dark:text-white">{gasEstimate}</span>
        </div>
      )}

      {/* Additional content (e.g., confirmation checkbox) */}
      {children}
    </div>
  );
}
