'use client';

import { useState } from 'react';
import { useUserBorrows } from '@/hooks/useUserBorrows';
import { formatTokenAmount, formatUSD, formatAPY } from '@/lib/utils';
import ModalRepay from './modals/ModalRepay';

export default function YourBorrows() {
  const { borrows, isLoading } = useUserBorrows();
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

  if (borrows.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
        <h2 className="text-2xl font-bold mb-6">Your Borrows</h2>
        <div className="text-center py-12 text-gray-500">
          <p>You haven't borrowed any assets yet.</p>
          <p className="text-sm mt-2">Supply collateral first to enable borrowing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
      <h2 className="text-2xl font-bold mb-6">Your Borrows</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4">Asset</th>
              <th className="text-right py-3 px-4">Borrowed</th>
              <th className="text-right py-3 px-4">APY</th>
              <th className="text-right py-3 px-4">Interest</th>
              <th className="text-right py-3 px-4">Total Debt</th>
              <th className="text-center py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {borrows.map((borrow) => (
              <tr
                key={borrow.asset.address}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                      {borrow.asset.symbol.slice(0, 2)}
                    </div>
                    <div className="font-semibold">{borrow.asset.symbol}</div>
                  </div>
                </td>
                <td className="text-right py-4 px-4">
                  <div>{formatTokenAmount(borrow.borrowed, borrow.asset.decimals)} {borrow.asset.symbol}</div>
                  <div className="text-sm text-gray-500">
                    {formatUSD(parseFloat(borrow.borrowedUSD))}
                  </div>
                </td>
                <td className="text-right py-4 px-4">
                  <span className="text-red-600 font-semibold">
                    {formatAPY(parseFloat(borrow.apy))}
                  </span>
                </td>
                <td className="text-right py-4 px-4">
                  <span className="text-yellow-600">
                    {formatTokenAmount(borrow.accruedInterest, borrow.asset.decimals)} {borrow.asset.symbol}
                  </span>
                </td>
                <td className="text-right py-4 px-4">
                  <div className="font-semibold">{formatTokenAmount(borrow.totalDebt, borrow.asset.decimals)} {borrow.asset.symbol}</div>
                  <div className="text-sm text-gray-500">
                    {formatUSD(parseFloat(borrow.totalDebtUSD))}
                  </div>
                </td>
                <td className="text-center py-4 px-4">
                  <button
                    onClick={() => setSelectedAsset(borrow.asset.address)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    Repay
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedAsset && (
        <ModalRepay
          borrow={borrows.find(b => b.asset.address === selectedAsset)!}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}
