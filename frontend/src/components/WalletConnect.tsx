'use client';

import { useWeb3 } from '@/hooks/useWeb3';
import { truncateAddress } from '@/lib/utils';
import { CHAIN_NAMES } from '@/lib/contracts';

export default function WalletConnect() {
  const { account, isConnected, chainId, connect, disconnect } = useWeb3();

  if (isConnected && account) {
    return (
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {CHAIN_NAMES[chainId] || `Chain ${chainId}`}
          </span>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
            {account.slice(2, 4).toUpperCase()}
          </div>
          <span className="font-mono text-sm">{truncateAddress(account)}</span>
        </div>

        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105"
    >
      Connect Wallet
    </button>
  );
}
