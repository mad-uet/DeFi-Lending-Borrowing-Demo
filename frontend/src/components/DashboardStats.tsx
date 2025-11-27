'use client';

import { useUserAccountData } from '@/hooks/useUserAccountData';
import { useEducationalMode } from '@/hooks/useEducationalMode';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

interface StatCardProps {
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'amber' | 'red';
  description?: string;
}

const colorStyles = {
  blue: {
    bg: 'from-blue-500 to-blue-600',
    lightBg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  green: {
    bg: 'from-green-500 to-green-600',
    lightBg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  purple: {
    bg: 'from-purple-500 to-purple-600',
    lightBg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  amber: {
    bg: 'from-amber-500 to-amber-600',
    lightBg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  red: {
    bg: 'from-red-500 to-red-600',
    lightBg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
};

function StatCard({ title, value, prefix, suffix, trend, trendValue, icon, color, description }: StatCardProps) {
  const styles = colorStyles[color];
  const { isEnabled: isEducationalMode } = useEducationalMode();

  return (
    <div className={`relative overflow-hidden rounded-xl border ${styles.border} ${styles.lightBg} p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}>
      {/* Gradient accent */}
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${styles.bg} opacity-10 rounded-full -translate-y-6 translate-x-6`} />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`${styles.text} text-lg`}>{icon}</span>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
          </div>
          
          <div className="flex items-baseline gap-1">
            {prefix && <span className={`text-lg font-medium ${styles.text}`}>{prefix}</span>}
            <AnimatedNumber 
              value={typeof value === 'number' ? value : parseFloat(value) || 0} 
              decimals={2}
              className={`text-2xl font-bold ${styles.text}`}
            />
            {suffix && <span className={`text-sm font-medium ${styles.text}`}>{suffix}</span>}
          </div>

          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
            }`}>
              <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
              <span>{trendValue}</span>
            </div>
          )}

          {isEducationalMode && description && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardStats() {
  const { accountData, isLoading: loading } = useUserAccountData();
  const { isEnabled: isEducationalMode } = useEducationalMode();

  const { totalCollateralUSD, totalBorrowsUSD, healthFactor } = accountData;
  
  // Calculate Net APY (simplified - would need actual rates from protocol)
  // For demo: assume ~3% supply APY and ~5% borrow APY
  const supplyAPY = 0.03;
  const borrowAPY = 0.05;
  const netAPY = totalCollateralUSD > 0 
    ? ((totalCollateralUSD * supplyAPY) - (totalBorrowsUSD * borrowAPY)) / totalCollateralUSD
    : 0;

  // Calculate available to borrow (simplified)
  const maxBorrowableUSD = totalCollateralUSD * 0.75; // 75% LTV
  const availableToBorrowUSD = Math.max(0, maxBorrowableUSD - totalBorrowsUSD);

  // Calculate utilization
  const utilization = totalCollateralUSD > 0 
    ? (totalBorrowsUSD / totalCollateralUSD) * 100 
    : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span>📊</span> Portfolio Overview
        </h2>
        {isEducationalMode && (
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            💡 Hover for explanations
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Supplied"
          value={totalCollateralUSD}
          prefix="$"
          icon="📥"
          color="green"
          trend={totalCollateralUSD > 0 ? 'up' : 'neutral'}
          trendValue="Earning interest"
          description="The total USD value of assets you've deposited as collateral"
        />

        <StatCard
          title="Total Borrowed"
          value={totalBorrowsUSD}
          prefix="$"
          icon="💰"
          color="purple"
          trend={totalBorrowsUSD > 0 ? 'neutral' : 'neutral'}
          trendValue="Accruing interest"
          description="The total USD value of assets you've borrowed against your collateral"
        />

        <StatCard
          title="Available to Borrow"
          value={availableToBorrowUSD}
          prefix="$"
          icon="🔓"
          color="blue"
          description="Additional borrowing capacity based on your collateral"
        />

        <StatCard
          title="Net APY"
          value={netAPY * 100}
          suffix="%"
          icon={netAPY >= 0 ? "📈" : "📉"}
          color={netAPY >= 0 ? "green" : "red"}
          trend={netAPY >= 0 ? 'up' : 'down'}
          trendValue={netAPY >= 0 ? "Earning" : "Paying"}
          description="Combined annual yield from supply earnings minus borrow costs"
        />
      </div>

      {/* Utilization Bar */}
      {totalCollateralUSD > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Collateral Utilization
            </span>
            <span className={`text-sm font-semibold ${
              utilization < 50 ? 'text-green-600' : utilization < 75 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {utilization.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                utilization < 50 
                  ? 'bg-gradient-to-r from-green-400 to-green-500' 
                  : utilization < 75 
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                    : 'bg-gradient-to-r from-red-400 to-red-500'
              }`}
              style={{ width: `${Math.min(100, utilization)}%` }}
            />
          </div>
          {isEducationalMode && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              💡 Utilization shows how much of your collateral is being used. Keep it below 75% to maintain a safe position.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for sidebar
export function CompactStats() {
  const { accountData, isLoading: loading } = useUserAccountData();

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ))}
      </div>
    );
  }

  const { totalCollateralUSD, totalBorrowsUSD } = accountData;
  
  // Calculate Net APY (simplified - would need actual rates from protocol)
  const supplyAPY = 0.03;
  const borrowAPY = 0.05;
  const netAPY = totalCollateralUSD > 0 
    ? ((totalCollateralUSD * supplyAPY) - (totalBorrowsUSD * borrowAPY)) / totalCollateralUSD
    : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <span className="text-xs text-gray-600 dark:text-gray-400">Supplied</span>
        <span className="text-sm font-semibold text-green-600">${totalCollateralUSD.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <span className="text-xs text-gray-600 dark:text-gray-400">Borrowed</span>
        <span className="text-sm font-semibold text-purple-600">${totalBorrowsUSD.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <span className="text-xs text-gray-600 dark:text-gray-400">Net APY</span>
        <span className={`text-sm font-semibold ${netAPY >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {(netAPY * 100).toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
