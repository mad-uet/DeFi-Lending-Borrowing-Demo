'use client';

import useSWR from 'swr';
import { useWeb3 } from '@/hooks/useWeb3';
import { useContract } from '@/hooks/useContract';
import { getHealthFactorColor, getHealthFactorStatus } from '@/lib/utils';

export default function HealthFactor() {
  const { account, isConnected } = useWeb3();
  const lendingPool = useContract('LendingPool');

  const { data: healthFactor, isLoading } = useSWR(
    isConnected && account && lendingPool ? ['healthFactor', account] : null,
    async () => {
      const hf = await lendingPool!.calculateHealthFactor(account);
      // Health factor is returned as uint256 with 18 decimals
      // Convert to readable format
      const hfNumber = Number(hf) / 1e18;
      return hfNumber.toFixed(2);
    },
    {
      refreshInterval: 5000,
    }
  );

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
  const status = hf === '∞' ? 'safe' : getHealthFactorStatus(hf);
  const colorClass = hf === '∞' ? 'text-health-safe' : getHealthFactorColor(hf);

  const statusConfig = {
    safe: {
      bg: 'bg-health-safe',
      text: 'Safe',
      description: 'Your position is healthy',
    },
    warning: {
      bg: 'bg-health-warning',
      text: 'Warning',
      description: 'Your position is at risk. Consider adding collateral or repaying debt.',
    },
    danger: {
      bg: 'bg-health-danger',
      text: 'Danger',
      description: 'Your position may be liquidated! Add collateral or repay debt immediately.',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Health Factor</h2>
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
        <div className={`w-16 h-16 ${config.bg} rounded-full flex items-center justify-center ${status !== 'safe' && 'animate-pulse'}`}>
          <div className="w-8 h-8 bg-white rounded-full"></div>
        </div>
        <div className="flex-1">
          <div className={`text-3xl font-bold ${colorClass}`}>
            {hf}
          </div>
          <div className="text-sm text-gray-500">{config.text}</div>
        </div>
      </div>

      {status !== 'safe' && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ {config.description}
          </p>
        </div>
      )}
    </div>
  );
}
