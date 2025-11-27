'use client';

import { useState } from 'react';
import Link from 'next/link';
import WalletConnect from '@/components/WalletConnect';
import SupplyAssets from '@/components/SupplyAssets';
import YourSupplies from '@/components/YourSupplies';
import BorrowAssets from '@/components/BorrowAssets';
import YourBorrows from '@/components/YourBorrows';
import HealthFactor from '@/components/HealthFactor';
import Faucet from '@/components/Faucet';
import ClientOnly from '@/components/ClientOnly';
import NotificationCenter from '@/components/ui/NotificationCenter';
import DashboardStats from '@/components/DashboardStats';
import QuickActions from '@/components/QuickActions';
import PositionSummary from '@/components/PositionSummary';
import { LiquidationWarningBanner } from '@/components/LiquidationWarning';
import { TransactionHistory } from '@/components/TransactionHistory';
import { EducationalToggle, EducationalBadge, EducationalPanel } from '@/components/educational';
import { EducationalFloatingToggle } from '@/components/educational/EducationalToggle';
import { useWeb3 } from '@/hooks/useWeb3';
import { useEducationalMode } from '@/hooks/useEducationalMode';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'supply' | 'borrow'>('supply');
  const { isConnected } = useWeb3();
  const { isEnabled: isEducationalMode } = useEducationalMode();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  DL
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    DeFi Lending & Borrowing
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Supply, borrow, and earn rewards
                  </p>
                </div>
              </div>
              <nav className="hidden md:flex items-center gap-4">
                <Link
                  href="/"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/analytics"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Analytics
                </Link>
                <Link
                  href="/status"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  🔧 Status
                </Link>
              </nav>
            </div>
            <ClientOnly>
              <div className="flex items-center gap-3">
                <EducationalBadge />
                <EducationalToggle size="sm" />
                <div className="relative">
                  <NotificationCenter />
                </div>
                <WalletConnect />
              </div>
            </ClientOnly>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <ClientOnly>
          {!isConnected ? (
            <div className="max-w-2xl mx-auto mt-20">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold mb-4">Welcome to DeFi Lending</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Connect your wallet to start supplying assets, earning interest, and borrowing against your collateral.
                </p>
                <div className="space-y-4 text-left max-w-md mx-auto">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-semibold">Supply & Earn</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Deposit assets to earn interest and LAR rewards
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-semibold">Borrow Assets</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Borrow against your collateral at competitive rates
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-semibold">Track Health</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Monitor your position health in real-time
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`grid gap-6 ${isEducationalMode ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1 lg:grid-cols-3'}`}>
              {/* Liquidation Warning Banner - Full Width */}
              <div className={isEducationalMode ? 'lg:col-span-4' : 'lg:col-span-3'}>
                <LiquidationWarningBanner />
              </div>

              {/* Dashboard Stats - Full Width */}
              <div className={isEducationalMode ? 'lg:col-span-4' : 'lg:col-span-3'}>
                <DashboardStats />
              </div>

              {/* Left Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <HealthFactor />

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                  <QuickActions 
                    onSupply={() => setActiveTab('supply')}
                    onBorrow={() => setActiveTab('borrow')}
                  />
                </div>
                
                {/* Transaction History Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                  <TransactionHistory maxItems={5} compact />
                </div>
                
                <Faucet />
              </div>

              {/* Main Content */}
              <div className={`${isEducationalMode ? 'lg:col-span-2' : 'lg:col-span-2'}`}>
                {/* Tabs */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6">
                  <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setActiveTab('supply')}
                      className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                        activeTab === 'supply'
                          ? 'text-primary-600 border-b-2 border-primary-600'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      📥 Supply
                    </button>
                    <button
                      onClick={() => setActiveTab('borrow')}
                      className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                        activeTab === 'borrow'
                          ? 'text-primary-600 border-b-2 border-primary-600'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      💰 Borrow
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'supply' ? (
                  <>
                    <SupplyAssets />
                    <YourSupplies />
                  </>
                ) : (
                  <>
                    <BorrowAssets />
                    <YourBorrows />
                  </>
                )}

                {/* Position Summary */}
                <div className="mt-6">
                  <PositionSummary />
                </div>
              </div>

              {/* Educational Panel - Right Sidebar (only when enabled) */}
              {isEducationalMode && (
                <div className="lg:col-span-1">
                  <EducationalPanel />
                </div>
              )}
            </div>
          )}
        </ClientOnly>
      </div>

      {/* Floating Educational Toggle */}
      <ClientOnly>
        <EducationalFloatingToggle />
      </ClientOnly>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-20">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>DeFi Lending & Borrowing Protocol</p>
            <p className="mt-1">Built with Next.js, Ethers.js, and Hardhat</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
