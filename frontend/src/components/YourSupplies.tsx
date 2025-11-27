'use client';

import { useState } from 'react';
import { useUserSupplies } from '@/hooks/useUserSupplies';
import { formatTokenAmount, formatUSD, formatAPY } from '@/lib/utils';
import ModalWithdraw from './modals/ModalWithdraw';

export default function YourSupplies() {
  const { supplies, isLoading } = useUserSupplies();
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (supplies.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
        <h2 className="text-2xl font-bold mb-6">Your Supplies</h2>
        <div className="text-center py-12 text-gray-500">
          <p>You haven't supplied any assets yet.</p>
          <p className="text-sm mt-2">Supply assets above to start earning interest.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
      <h2 className="text-2xl font-bold mb-6">Your Supplies</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4">Asset</th>
              <th className="text-right py-3 px-4">Supplied</th>
              <th className="text-right py-3 px-4">APY</th>
              <th className="text-right py-3 px-4">LAR Earned</th>
              <th className="text-center py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {supplies.map((supply) => (
              <tr
                key={supply.asset.address}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      {supply.asset.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold">{supply.asset.symbol}</div>
                      {supply.isCollateral && (
                        <div className="text-xs text-green-600">✓ Collateral</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="text-right py-4 px-4">
                  <div>{formatTokenAmount(supply.supplied, supply.asset.decimals)} {supply.asset.symbol}</div>
                  <div className="text-sm text-gray-500">
                    {formatUSD(parseFloat(supply.suppliedUSD))}
                  </div>
                </td>
                <td className="text-right py-4 px-4">
                  <div className="group relative inline-block">
                    <span className="text-green-600 font-semibold">
                      {formatAPY(parseFloat(supply.apy))}
                    </span>
                    {parseFloat(supply.apy) === 0 && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        No borrows yet = No interest earned
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="text-right py-4 px-4">
                  <span className="text-primary-600 font-semibold">
                    {formatTokenAmount(supply.larEarned, 18)} LAR
                  </span>
                </td>
                <td className="text-center py-4 px-4">
                  <button
                    onClick={() => setSelectedAsset(supply.asset.address)}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                  >
                    Withdraw
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedAsset && (
        <ModalWithdraw
          supply={supplies.find(s => s.asset.address === selectedAsset)!}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}
