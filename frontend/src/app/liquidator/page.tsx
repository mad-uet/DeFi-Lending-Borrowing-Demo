'use client';

import ClientOnly from '@/components/ClientOnly';
import { LiquidatorDashboard } from '@/components/liquidation';
import { useWeb3 } from '@/hooks/useWeb3';

export default function LiquidatorPage() {
  const { isConnected } = useWeb3();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <ClientOnly>
          {!isConnected ? (
            <div className="max-w-2xl mx-auto mt-20">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-4xl">🤖</span>
                </div>
                <h2 className="text-3xl font-bold mb-4">Liquidator Dashboard</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Connect your wallet to access the liquidator bot simulation.
                  Monitor positions, execute liquidations, and track your profits.
                </p>
                <div className="space-y-4 text-left max-w-md mx-auto">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-semibold">Monitor Positions</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Scan for liquidatable positions in real-time
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-semibold">Execute Liquidations</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Repay debt and receive collateral at a 5% discount
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-semibold">Auto-Liquidation</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enable automatic liquidation with configurable delay
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <LiquidatorDashboard />
          )}
        </ClientOnly>
      </div>

      {/* Educational Info */}
      <div className="container mx-auto px-4 pb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-4 flex items-center gap-2">
            <span>📚</span> How Liquidation Works
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl mb-2">1️⃣</div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Position Becomes Undercollateralized</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                When health factor drops below 1.0, the position can be liquidated.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl mb-2">2️⃣</div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Liquidator Repays Debt</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The liquidator pays up to 50% of the borrower's debt.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl mb-2">3️⃣</div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Collateral Seized</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The liquidator receives equivalent collateral plus a 5% bonus.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl mb-2">4️⃣</div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Position Improved</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The borrower's health factor improves after liquidation.
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>💡 Simulation Mode:</strong> This liquidator dashboard simulates how real liquidation bots work.
              In production, liquidators compete to execute liquidations for profit.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-8">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>DeFi Lending & Borrowing Protocol - Liquidator Dashboard</p>
            <p className="mt-1">Built with Next.js, Ethers.js, and Hardhat</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
