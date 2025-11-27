'use client';

import { useState } from 'react';
import { useTransactionHistory, Transaction } from '../hooks/useTransactionHistory';

interface TransactionHistoryProps {
  maxItems?: number;
  showClearButton?: boolean;
  compact?: boolean;
}

export function TransactionHistory({ maxItems = 10, showClearButton = true, compact = false }: TransactionHistoryProps) {
  const { transactions, isLoading, clearHistory } = useTransactionHistory();
  const [expanded, setExpanded] = useState<string | null>(null);

  const displayedTransactions = transactions.slice(0, maxItems);

  const getTypeInfo = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return {
          label: 'Deposited',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          ),
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
        };
      case 'withdraw':
        return {
          label: 'Withdrew',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          ),
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/20',
        };
      case 'borrow':
        return {
          label: 'Borrowed',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
        };
      case 'repay':
        return {
          label: 'Repaid',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/20',
        };
      case 'liquidation':
        return {
          label: 'Liquidated',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
        };
    }
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-300">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-yellow-400 animate-pulse" />
            Pending
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-300">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Confirmed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-300">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Failed
          </span>
        );
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;

    // Less than a minute
    if (diff < 60000) {
      return 'Just now';
    }
    // Less than an hour
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins}m ago`;
    }
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    // Otherwise show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toFixed(4);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-700/50 mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm">No transactions yet</p>
        <p className="text-gray-500 text-xs mt-1">Your transaction history will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">
          Recent Transactions
          <span className="ml-2 text-xs text-gray-500">({transactions.length})</span>
        </h3>
        {showClearButton && transactions.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Transaction List */}
      <div className="space-y-1">
        {displayedTransactions.map((tx) => {
          const typeInfo = getTypeInfo(tx.type);
          const isExpanded = expanded === tx.id;

          return (
            <div
              key={tx.id}
              className={`rounded-lg transition-all duration-200 ${
                isExpanded ? 'bg-gray-700/50' : 'hover:bg-gray-700/30'
              }`}
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : tx.id)}
                className="w-full px-3 py-2 flex items-center gap-3 text-left"
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${typeInfo.bgColor} flex items-center justify-center ${typeInfo.color}`}>
                  {typeInfo.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200">
                      {typeInfo.label}
                    </span>
                    {!compact && getStatusBadge(tx.status)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatAmount(tx.amount)} {tx.asset}
                  </div>
                </div>

                {/* Time */}
                <div className="flex-shrink-0 text-xs text-gray-500">
                  {formatTime(tx.timestamp)}
                </div>

                {/* Expand indicator */}
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-2 animate-slide-in-up">
                  {/* Health Factor Change */}
                  {tx.healthFactorBefore !== undefined && tx.healthFactorAfter !== undefined && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">Health Factor:</span>
                      <span className="text-gray-400">
                        {tx.healthFactorBefore === Infinity ? '∞' : tx.healthFactorBefore.toFixed(2)}
                      </span>
                      <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className={tx.healthFactorAfter < tx.healthFactorBefore ? 'text-red-400' : 'text-green-400'}>
                        {tx.healthFactorAfter === Infinity ? '∞' : tx.healthFactorAfter.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Transaction Hash */}
                  {tx.txHash && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">Tx Hash:</span>
                      <code className="text-gray-400 font-mono">
                        {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                      </code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(tx.txHash!);
                        }}
                        className="text-primary-400 hover:text-primary-300"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">Time:</span>
                    <span className="text-gray-400">
                      {new Date(tx.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more indicator */}
      {transactions.length > maxItems && (
        <div className="text-center pt-2">
          <span className="text-xs text-gray-500">
            +{transactions.length - maxItems} more transactions
          </span>
        </div>
      )}
    </div>
  );
}

// Compact inline version for dashboard
export function TransactionHistoryInline({ count = 3 }: { count?: number }) {
  const { transactions } = useTransactionHistory();
  const recentTxs = transactions.slice(0, count);

  if (recentTxs.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {recentTxs.map((tx) => {
        const typeColors = {
          deposit: 'bg-green-500',
          withdraw: 'bg-orange-500',
          borrow: 'bg-blue-500',
          repay: 'bg-purple-500',
          liquidation: 'bg-red-500',
        };

        return (
          <div
            key={tx.id}
            className="group relative"
          >
            <div className={`w-2 h-2 rounded-full ${typeColors[tx.type]} ${tx.status === 'pending' ? 'animate-pulse' : ''}`} />
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
              <div className="bg-gray-800 rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} {parseFloat(tx.amount).toFixed(2)} {tx.asset}
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
