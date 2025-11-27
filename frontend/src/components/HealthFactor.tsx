'use client';

import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { useWeb3 } from '@/hooks/useWeb3';
import { useContract } from '@/hooks/useContract';
import { getHealthFactorColor, getHealthFactorStatus } from '@/lib/utils';

interface HealthFactorTrend {
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
}

export default function HealthFactor() {
  const { account, isConnected } = useWeb3();
  const lendingPool = useContract('LendingPool');
  const previousValueRef = useRef<number | null>(null);
  const [trend, setTrend] = useState<HealthFactorTrend>({ direction: 'stable', changePercent: 0 });
  const [showChange, setShowChange] = useState(false);

  const { data: healthFactor, isLoading } = useSWR(
    isConnected && account && lendingPool ? ['healthFactor', account] : null,
    async () => {
      const hf = await lendingPool!.calculateHealthFactor(account);
      // Health factor is returned as uint256 with 18 decimals
      // type(uint256).max means no debt (infinite health)
      const maxUint256 = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');
      if (hf >= maxUint256 / BigInt(2)) {
        return '∞'; // No debt, infinite health
      }
      const hfNumber = Number(hf) / 1e18;
      if (hfNumber > 100) {
        return '> 100'; // Cap display at 100
      }
      return hfNumber.toFixed(2);
    },
    {
      refreshInterval: 5000,
    }
  );

  // Track health factor changes for trend indicator
  useEffect(() => {
    if (healthFactor && healthFactor !== '∞' && healthFactor !== '> 100') {
      const currentValue = parseFloat(healthFactor);
      const previousValue = previousValueRef.current;

      if (previousValue !== null && !isNaN(previousValue) && !isNaN(currentValue)) {
        const change = currentValue - previousValue;
        const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

        if (Math.abs(changePercent) > 0.1) { // Only show if change > 0.1%
          const direction = change > 0 ? 'up' : 'down';
          setTrend({ direction, changePercent: Math.abs(changePercent) });
          setShowChange(true);
          
          // Hide the change indicator after animation
          setTimeout(() => setShowChange(false), 3000);
        }
      }

      previousValueRef.current = currentValue;
    }
  }, [healthFactor]);

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Health Factor</h2>
        <p className="text-gray-500">Connect wallet to view health factor</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const hf = healthFactor || '∞';
  const isInfinite = hf === '∞' || hf === '> 100';
  const status = isInfinite ? 'safe' : getHealthFactorStatus(hf);
  const colorClass = isInfinite ? 'text-health-safe' : getHealthFactorColor(hf);

  const statusConfig = {
    safe: {
      bg: 'bg-health-safe',
      text: 'Safe',
      description: 'Your position is healthy',
      icon: '✓',
    },
    warning: {
      bg: 'bg-health-warning',
      text: 'Warning',
      description: 'Your position is at risk. Consider adding collateral or repaying debt.',
      icon: '⚠',
    },
    danger: {
      bg: 'bg-health-danger',
      text: 'Danger',
      description: 'Your position may be liquidated! Add collateral or repay debt immediately.',
      icon: '⛔',
    },
  };

  const config = statusConfig[status];

  const TrendIndicator = () => {
    if (!showChange || trend.direction === 'stable') return null;

    const isPositive = trend.direction === 'up';
    
    return (
      <span className={`inline-flex items-center ml-2 text-sm font-medium animate-slide-in-right ${
        isPositive ? 'text-green-400' : 'text-red-400'
      }`}>
        {isPositive ? (
          <svg className="w-4 h-4 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        ) : (
          <svg className="w-4 h-4 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )}
        <span>{trend.changePercent.toFixed(1)}%</span>
      </span>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all duration-300 ${
      status === 'danger' ? 'ring-2 ring-red-500 animate-pulse-glow' : ''
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Health Factor</h2>
          {/* Live indicator */}
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>
        <div className="group relative">
          <svg
            className="w-5 h-5 text-gray-400 cursor-help"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="hidden group-hover:block absolute right-0 top-6 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-10">
            Health factor represents the safety of your deposited assets against borrowed assets.
            <br /><br />
            <strong>{'>'} 1.5:</strong> Safe<br />
            <strong>1.0 - 1.5:</strong> Warning<br />
            <strong>{'<'} 1.0:</strong> Liquidation risk
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Animated status indicator */}
        <div className={`relative w-16 h-16 ${config.bg} rounded-full flex items-center justify-center ${
          status !== 'safe' ? 'animate-health-pulse' : ''
        }`}>
          <div className="absolute inset-0 rounded-full bg-white/20" />
          <span className="text-2xl relative z-10">{config.icon}</span>
          
          {/* Ripple effect for danger state */}
          {status === 'danger' && (
            <>
              <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse" />
            </>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center">
            <span className={`text-3xl font-bold ${colorClass} ${showChange ? 'animate-scale-in' : ''}`}>
              {hf}
            </span>
            <TrendIndicator />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{config.text}</span>
            {/* Threshold indicator */}
            {!isInfinite && (
              <span className="text-xs text-gray-400">
                (Liquidation at &lt; 1.0)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar showing distance from liquidation */}
      {!isInfinite && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Liquidation</span>
            <span>Safe Zone</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                status === 'danger' ? 'bg-red-500' :
                status === 'warning' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ 
                width: `${Math.min(100, (parseFloat(hf) / 2) * 100)}%` 
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>1.0</span>
            <span>1.2</span>
            <span>1.5</span>
            <span>2.0+</span>
          </div>
        </div>
      )}

      {status !== 'safe' && (
        <div className={`mt-4 p-3 rounded-lg border ${
          status === 'danger' 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        }`}>
          <p className={`text-sm ${
            status === 'danger' ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'
          }`}>
            {status === 'danger' ? '🚨' : '⚠️'} {config.description}
          </p>
          
          {/* Quick action buttons */}
          <div className="flex gap-2 mt-2">
            <button className="flex-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded transition-colors">
              + Add Collateral
            </button>
            <button className="flex-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded transition-colors">
              Repay Debt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
