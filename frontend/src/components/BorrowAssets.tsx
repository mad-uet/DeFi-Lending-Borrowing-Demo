'use client';

import { useState } from 'react';
import { useBorrowAssets } from '@/hooks/useBorrowAssets';
import { formatTokenAmount, formatUSD, formatAPY } from '@/lib/utils';
import ModalBorrow from './modals/ModalBorrow';

export default function BorrowAssets() {
  const { assets, isLoading } = useBorrowAssets();
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Assets to Borrow</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4">Asset</th>
              <th className="text-right py-3 px-4">APY</th>
              <th className="text-right py-3 px-4">Available</th>
              <th className="text-right py-3 px-4">Your Borrows</th>
              <th className="text-right py-3 px-4">Max Borrow</th>
              <th className="text-center py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr
                key={asset.address}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {asset.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold">{asset.symbol}</div>
                      <div className="text-sm text-gray-500">{asset.name}</div>
                    </div>
                  </div>
                </td>
                <td className="text-right py-4 px-4">
                  <span className="text-red-600 font-semibold">
                    {formatAPY(parseFloat(asset.borrowAPY))}
                  </span>
                </td>
                <td className="text-right py-4 px-4">
                  <div>{formatTokenAmount(asset.availableToBorrow, asset.decimals)} {asset.symbol}</div>
                  <div className="text-sm text-gray-500">
                    {formatUSD(parseFloat(asset.availableToBorrowUSD))}
                  </div>
                </td>
                <td className="text-right py-4 px-4">
                  <div>{formatTokenAmount(asset.yourBorrows, asset.decimals)} {asset.symbol}</div>
                  <div className="text-sm text-gray-500">
                    {formatUSD(parseFloat(asset.yourBorrowsUSD))}
                  </div>
                </td>
                <td className="text-right py-4 px-4">
                  <div>{formatTokenAmount(asset.maxBorrow, asset.decimals)} {asset.symbol}</div>
                  <div className="text-sm text-gray-500">
                    {formatUSD(parseFloat(asset.maxBorrowUSD))}
                  </div>
                </td>
                <td className="text-center py-4 px-4">
                  <button
                    onClick={() => setSelectedAsset(asset.address)}
                    disabled={parseFloat(asset.maxBorrow) === 0}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Borrow
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedAsset && (
        <ModalBorrow
          asset={assets.find(a => a.address === selectedAsset)!}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}
