'use client';

interface BalanceChange {
  label: string;
  symbol: string;
  before: string;
  after: string;
  direction: 'increase' | 'decrease' | 'neutral';
  icon?: string;
}

interface BalanceChangePreviewProps {
  changes: BalanceChange[];
  title?: string;
  compact?: boolean;
}

export default function BalanceChangePreview({
  changes,
  title = 'What will happen',
  compact = false,
}: BalanceChangePreviewProps) {
  const directionConfig = {
    increase: {
      arrow: '↑',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-700',
    },
    decrease: {
      arrow: '↓',
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-700',
    },
    neutral: {
      arrow: '→',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-800',
      borderColor: 'border-gray-200 dark:border-gray-700',
    },
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {changes.map((change, index) => {
          const config = directionConfig[change.direction];
          return (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-600 dark:text-gray-400">{change.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">{change.before}</span>
                <span className={`font-bold ${config.color}`}>{config.arrow}</span>
                <span className={`font-medium ${config.color}`}>{change.after}</span>
                <span className="text-gray-400">{change.symbol}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
        </div>
      </div>

      {/* Changes list */}
      <div className="p-4 space-y-3">
        {changes.map((change, index) => {
          const config = directionConfig[change.direction];
          return (
            <div
              key={index}
              className={`
                flex items-center gap-4 p-3 rounded-lg border
                ${config.bgColor} ${config.borderColor}
                transition-all duration-200 hover:shadow-sm
              `}
            >
              {/* Icon or symbol */}
              <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-sm">
                {change.icon ? (
                  <span className="text-lg">{change.icon}</span>
                ) : (
                  <span className="font-bold text-gray-600 dark:text-gray-300">
                    {change.symbol.slice(0, 2)}
                  </span>
                )}
              </div>

              {/* Label and values */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {change.label}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {/* Before value */}
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {change.before}
                    </span>
                    <span className="text-xs text-gray-400">{change.symbol}</span>
                  </div>

                  {/* Arrow */}
                  <div className={`flex items-center ${config.color}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>

                  {/* After value */}
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-semibold ${config.color}`}>
                      {change.after}
                    </span>
                    <span className="text-xs text-gray-400">{change.symbol}</span>
                  </div>
                </div>
              </div>

              {/* Change indicator */}
              <div className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${config.color} ${config.bgColor} border ${config.borderColor}`}>
                {config.arrow} {change.direction === 'increase' ? '+' : change.direction === 'decrease' ? '-' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper function to calculate balance changes for different transaction types
export function calculateBalanceChanges(
  type: 'supply' | 'withdraw' | 'borrow' | 'repay',
  amount: string,
  symbol: string,
  currentWalletBalance: string,
  currentPoolBalance: string,
  currentBorrowed?: string,
): BalanceChange[] {
  const amountNum = parseFloat(amount) || 0;
  const walletNum = parseFloat(currentWalletBalance) || 0;
  const poolNum = parseFloat(currentPoolBalance) || 0;
  const borrowedNum = parseFloat(currentBorrowed || '0') || 0;

  const formatNum = (num: number) => num.toLocaleString('en-US', { maximumFractionDigits: 4 });

  switch (type) {
    case 'supply':
      return [
        {
          label: 'Your Wallet',
          symbol,
          before: formatNum(walletNum),
          after: formatNum(Math.max(0, walletNum - amountNum)),
          direction: 'decrease',
          icon: '👛',
        },
        {
          label: 'Your Deposits',
          symbol,
          before: formatNum(poolNum),
          after: formatNum(poolNum + amountNum),
          direction: 'increase',
          icon: '🏦',
        },
        {
          label: 'Collateral Value',
          symbol: 'USD',
          before: formatNum(poolNum * 1), // Would use actual price
          after: formatNum((poolNum + amountNum) * 1),
          direction: 'increase',
          icon: '🛡️',
        },
      ];

    case 'withdraw':
      return [
        {
          label: 'Your Deposits',
          symbol,
          before: formatNum(poolNum),
          after: formatNum(Math.max(0, poolNum - amountNum)),
          direction: 'decrease',
          icon: '🏦',
        },
        {
          label: 'Your Wallet',
          symbol,
          before: formatNum(walletNum),
          after: formatNum(walletNum + amountNum),
          direction: 'increase',
          icon: '👛',
        },
      ];

    case 'borrow':
      return [
        {
          label: 'Pool Liquidity',
          symbol,
          before: formatNum(poolNum),
          after: formatNum(Math.max(0, poolNum - amountNum)),
          direction: 'decrease',
          icon: '🏦',
        },
        {
          label: 'Your Wallet',
          symbol,
          before: formatNum(walletNum),
          after: formatNum(walletNum + amountNum),
          direction: 'increase',
          icon: '👛',
        },
        {
          label: 'Your Debt',
          symbol,
          before: formatNum(borrowedNum),
          after: formatNum(borrowedNum + amountNum),
          direction: 'increase',
          icon: '📋',
        },
      ];

    case 'repay':
      return [
        {
          label: 'Your Wallet',
          symbol,
          before: formatNum(walletNum),
          after: formatNum(Math.max(0, walletNum - amountNum)),
          direction: 'decrease',
          icon: '👛',
        },
        {
          label: 'Your Debt',
          symbol,
          before: formatNum(borrowedNum),
          after: formatNum(Math.max(0, borrowedNum - amountNum)),
          direction: 'decrease',
          icon: '📋',
        },
        {
          label: 'Pool Liquidity',
          symbol,
          before: formatNum(poolNum),
          after: formatNum(poolNum + amountNum),
          direction: 'increase',
          icon: '🏦',
        },
      ];

    default:
      return [];
  }
}
