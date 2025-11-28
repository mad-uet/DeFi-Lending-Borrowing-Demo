'use client';

import { useState } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import { truncateAddress } from '@/lib/utils';
import { CHAIN_NAMES, CHAIN_ID } from '@/lib/contracts';

export default function WalletConnect() {
  const { account, isConnected, chainId, connect, disconnect, switchNetwork } = useWeb3();
  const [showMenu, setShowMenu] = useState(false);

  if (isConnected && chainId !== CHAIN_ID) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="font-medium">Wrong Network</span>
        </div>
        <button
          onClick={() => switchNetwork?.()}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Switch
        </button>
      </div>
    );
  }

  if (isConnected && account) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {account.slice(2, 4).toUpperCase()}
          </div>
          <span className="font-mono text-sm text-gray-700 dark:text-gray-200">{truncateAddress(account)}</span>
          <svg className={`w-4 h-4 text-gray-500 transition-transform ${showMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-slide-down">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">Connected to</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{CHAIN_NAMES[chainId] || `Chain ${chainId}`}</p>
              </div>
              <button
                onClick={() => {
                  disconnect();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all text-sm"
    >
      Connect Wallet
    </button>
  );
}
