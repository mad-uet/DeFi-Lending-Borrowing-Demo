'use client';

import { useState } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import { useEducationalMode } from '@/hooks/useEducationalMode';

export default function SimulationPanel() {
  const {
    isSimulationMode,
    startSimulation,
    stopSimulation,
    resetSimulation,
    simulatedBalances,
    simulatedTransactions,
    getSimulatedHealthFactor,
    getSimulatedTotalCollateral,
    getSimulatedTotalBorrows,
  } = useSimulation();
  const { isEnabled: isEducationalMode } = useEducationalMode();
  const [isExpanded, setIsExpanded] = useState(true);

  const healthFactor = getSimulatedHealthFactor();
  const totalCollateral = getSimulatedTotalCollateral();
  const totalBorrows = getSimulatedTotalBorrows();

  if (!isSimulationMode) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center text-2xl">
            🧪
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-1">
              Sandbox Simulation Mode
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
              Practice DeFi transactions without using real tokens. Perfect for learning and demonstrations.
            </p>
            <button
              onClick={startSimulation}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-amber-500/25"
            >
              🚀 Start Simulation
            </button>
            
            {isEducationalMode && (
              <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  💡 What you can practice:
                </h4>
                <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• Supply assets to earn simulated interest</li>
                  <li>• Borrow against your collateral safely</li>
                  <li>• Watch how health factor changes</li>
                  <li>• Experiment with different scenarios</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-400 dark:border-amber-600 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-amber-200/50 dark:bg-amber-800/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl animate-pulse">🧪</span>
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">
              Simulation Active
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              No real transactions - safe to experiment
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-amber-700 dark:text-amber-300 hover:bg-amber-300/50 dark:hover:bg-amber-700/50 rounded"
          >
            {isExpanded ? '▼' : '▲'}
          </button>
          <button
            onClick={resetSimulation}
            className="px-3 py-1.5 text-xs font-medium bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-lg hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={stopSimulation}
            className="px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400">Collateral</div>
              <div className="text-lg font-bold text-green-600">${totalCollateral.toFixed(2)}</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400">Borrowed</div>
              <div className="text-lg font-bold text-purple-600">${totalBorrows.toFixed(2)}</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400">Health</div>
              <div className={`text-lg font-bold ${
                !isFinite(healthFactor) || healthFactor > 2 ? 'text-green-600' :
                healthFactor > 1.5 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {isFinite(healthFactor) ? healthFactor.toFixed(2) : '∞'}
              </div>
            </div>
          </div>

          {/* Simulated Balances */}
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Simulated Balances
            </h4>
            <div className="space-y-2">
              {Object.values(simulatedBalances).map(balance => (
                <div key={balance.symbol} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{balance.symbol}</span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-gray-500">Wallet: {balance.wallet.toFixed(2)}</span>
                    <span className="text-green-600">Supplied: {balance.supplied.toFixed(2)}</span>
                    <span className="text-purple-600">Borrowed: {balance.borrowed.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Simulated Transactions */}
          {simulatedTransactions.length > 0 && (
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Simulation History
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {simulatedTransactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${
                      tx.type === 'supply' ? 'text-green-600' :
                      tx.type === 'borrow' ? 'text-purple-600' :
                      tx.type === 'withdraw' ? 'text-amber-600' : 'text-blue-600'
                    }`}>
                      {tx.type.toUpperCase()} {tx.amount.toFixed(2)} {tx.symbol}
                    </span>
                    <span className="text-gray-500">
                      HF: {tx.healthFactorBefore.toFixed(2)} → {tx.healthFactorAfter.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Floating simulation mode badge
export function SimulationBadge() {
  const { isSimulationMode } = useSimulation();

  if (!isSimulationMode) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-full shadow-lg shadow-amber-500/30 flex items-center gap-2 animate-bounce-subtle">
        <span className="animate-pulse">🧪</span>
        <span>Simulation Mode</span>
      </div>
    </div>
  );
}

// Compact toggle for header
export function SimulationToggle() {
  const { isSimulationMode, startSimulation, stopSimulation } = useSimulation();

  return (
    <button
      onClick={isSimulationMode ? stopSimulation : startSimulation}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
        isSimulationMode
          ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/30'
      }`}
    >
      🧪 {isSimulationMode ? 'Simulating' : 'Simulate'}
    </button>
  );
}
