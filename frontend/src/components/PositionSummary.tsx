'use client';

import { useUserAccountData } from '@/hooks/useUserAccountData';
import { useEducationalMode } from '@/hooks/useEducationalMode';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

interface PositionBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
  icon: string;
}

function PositionBar({ label, value, total, color, icon }: PositionBarProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
          <span>{icon}</span>
          {label}
        </span>
        <span className="font-medium text-gray-900 dark:text-white">
          ${value.toFixed(2)}
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
}

export default function PositionSummary() {
  const { accountData, isLoading: loading } = useUserAccountData();
  const { isEnabled: isEducationalMode } = useEducationalMode();

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  const { totalCollateralUSD, totalBorrowsUSD, healthFactor } = accountData;
  
  // Calculate Net APY (simplified - would need actual rates from protocol)
  const supplyAPY = 0.03;
  const borrowAPY = 0.05;
  const netAPY = totalCollateralUSD > 0 
    ? ((totalCollateralUSD * supplyAPY) - (totalBorrowsUSD * borrowAPY)) / totalCollateralUSD
    : 0;

  // Calculate net worth
  const netWorth = totalCollateralUSD - totalBorrowsUSD;
  const totalValue = totalCollateralUSD + totalBorrowsUSD;

  // Pie chart segments (simplified visual)
  const supplyPercentage = totalValue > 0 ? (totalCollateralUSD / totalValue) * 100 : 100;
  const borrowPercentage = totalValue > 0 ? (totalBorrowsUSD / totalValue) * 100 : 0;

  // Risk level
  const getRiskLevel = () => {
    if (!isFinite(healthFactor) || healthFactor > 2) return { level: 'Safe', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (healthFactor > 1.5) return { level: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' };
    if (healthFactor > 1.0) return { level: 'At Risk', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' };
    return { level: 'Danger', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' };
  };

  const risk = getRiskLevel();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📊</span> Position Summary
          </h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${risk.bg} ${risk.color}`}>
            {risk.level}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Visual Summary - Donut Chart Style */}
        <div className="flex items-center gap-6 mb-6">
          {/* Simple Visual Chart */}
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Supply arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                className="text-green-500"
                strokeDasharray={`${supplyPercentage * 2.51} 251`}
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
              {/* Borrow arc */}
              {borrowPercentage > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeLinecap="round"
                  className="text-purple-500"
                  strokeDasharray={`${borrowPercentage * 2.51} 251`}
                  strokeDashoffset={-supplyPercentage * 2.51}
                  style={{ transition: 'stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease' }}
                />
              )}
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">Net Worth</span>
              <span className={`text-lg font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${netWorth.toFixed(0)}
              </span>
            </div>
          </div>

          {/* Legend & Values */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Supplied</span>
                <AnimatedNumber 
                  value={totalCollateralUSD} 
                  prefix="$" 
                  decimals={2}
                  className="text-sm font-semibold text-green-600"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Borrowed</span>
                <AnimatedNumber 
                  value={totalBorrowsUSD} 
                  prefix="$" 
                  decimals={2}
                  className="text-sm font-semibold text-purple-600"
                />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Net APY</span>
                <span className={`text-sm font-bold ${netAPY >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netAPY >= 0 ? '+' : ''}{(netAPY * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Position Bars */}
        <div className="space-y-4">
          <PositionBar
            label="Collateral"
            value={totalCollateralUSD}
            total={totalCollateralUSD}
            color="bg-gradient-to-r from-green-400 to-green-500"
            icon="📥"
          />
          <PositionBar
            label="Debt"
            value={totalBorrowsUSD}
            total={totalCollateralUSD}
            color="bg-gradient-to-r from-purple-400 to-purple-500"
            icon="💰"
          />
        </div>

        {/* Educational Info */}
        {isEducationalMode && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
              💡 Understanding Your Position
            </h4>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• <strong>Net Worth</strong> = Supplied - Borrowed</li>
              <li>• <strong>Net APY</strong> = Supply APY - Borrow APY (weighted)</li>
              <li>• Keep debt below 75% of collateral for safety</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Mini version for compact display
export function MiniPositionSummary() {
  const { accountData } = useUserAccountData();
  const { totalCollateralUSD, totalBorrowsUSD, healthFactor } = accountData;
  const netWorth = totalCollateralUSD - totalBorrowsUSD;

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex-1">
        <div className="text-xs text-gray-500 dark:text-gray-400">Net Position</div>
        <div className={`text-lg font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${netWorth.toFixed(2)}
        </div>
      </div>
      <div className="h-10 w-px bg-gray-300 dark:bg-gray-600" />
      <div className="flex-1">
        <div className="text-xs text-gray-500 dark:text-gray-400">Health</div>
        <div className={`text-lg font-bold ${
          !isFinite(healthFactor) || healthFactor > 2 ? 'text-green-600' :
          healthFactor > 1.5 ? 'text-amber-600' : 'text-red-600'
        }`}>
          {isFinite(healthFactor) ? healthFactor.toFixed(2) : '∞'}
        </div>
      </div>
    </div>
  );
}
