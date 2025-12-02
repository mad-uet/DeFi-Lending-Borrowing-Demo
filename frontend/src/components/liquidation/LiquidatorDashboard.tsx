'use client';

import { useState } from 'react';
import { useLiquidatorBot, useIsLiquidatorBotAvailable } from '@/hooks/useLiquidatorBot';
import { LiquidationHistoryList } from './LiquidationEventCard';
import { LiquidatablePosition } from '@/types';
import { LIQUIDATION_CONFIG } from '@/lib/contracts';

// Bot Control Panel
function BotControls() {
  const {
    isActive,
    autoLiquidate,
    liquidationDelay,
    startBot,
    stopBot,
    toggleAutoLiquidate,
    setLiquidationDelay,
    pendingLiquidation,
  } = useLiquidatorBot();

  return (
    <div className="bg-gray-800/80 rounded-xl border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          Liquidator Bot
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isActive 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
        }`}>
          {isActive ? '● Active' : '○ Inactive'}
        </div>
      </div>

      {/* Power Button */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={isActive ? stopBot : startBot}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            isActive
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isActive ? '⏹️ Stop Bot' : '▶️ Start Bot'}
        </button>
      </div>

      {/* Auto-Liquidate Toggle */}
      <div className="bg-gray-900/50 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Auto-Liquidate</p>
            <p className="text-xs text-gray-500">Automatically execute liquidations</p>
          </div>
          <button
            onClick={toggleAutoLiquidate}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              autoLiquidate ? 'bg-blue-500' : 'bg-gray-600'
            }`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              autoLiquidate ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Liquidation Delay Slider */}
      <div className="bg-gray-900/50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-white">Liquidation Delay</p>
          <span className="text-sm text-blue-400 font-mono">
            {(liquidationDelay / 1000).toFixed(1)}s
          </span>
        </div>
        <input
          type="range"
          min={LIQUIDATION_CONFIG.MIN_LIQUIDATION_DELAY_MS}
          max={LIQUIDATION_CONFIG.MAX_LIQUIDATION_DELAY_MS}
          step={500}
          value={liquidationDelay}
          onChange={(e) => setLiquidationDelay(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1s</span>
          <span>10s</span>
        </div>
      </div>

      {/* Pending Liquidation Countdown */}
      {pendingLiquidation && (
        <div className="mt-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-yellow-400">⏳ Liquidating...</p>
            <span className="text-lg font-bold text-yellow-300">
              {(pendingLiquidation.countdown / 1000).toFixed(1)}s
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all"
              style={{ 
                width: `${(pendingLiquidation.countdown / liquidationDelay) * 100}%` 
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Target: {pendingLiquidation.position.borrower.slice(0, 10)}...
          </p>
        </div>
      )}
    </div>
  );
}

// Liquidator Statistics
function LiquidatorStats() {
  const { stats, liquidator } = useLiquidatorBot();

  return (
    <div className="bg-gray-800/80 rounded-xl border border-gray-700 p-4">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">📊</span>
        Statistics
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.totalLiquidations}</p>
          <p className="text-xs text-gray-500">Liquidations</p>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-400">${stats.totalProfitUSD}</p>
          <p className="text-xs text-gray-500">Total Profit</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Debt Repaid</span>
          <span className="text-white font-mono">${stats.totalDebtRepaid}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Collateral Seized</span>
          <span className="text-white font-mono">${stats.totalCollateralSeized}</span>
        </div>
      </div>

      {/* Simulated Wallet Balance */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 mb-2">Liquidator Wallet</p>
        <p className="font-mono text-xs text-gray-400 truncate">{liquidator.address}</p>
      </div>
    </div>
  );
}

// Liquidatable Positions List
function LiquidatablePositionsList() {
  const { liquidatablePositions, atRiskPositions, executeLiquidation, isActive } = useLiquidatorBot();
  const [selectedPosition, setSelectedPosition] = useState<LiquidatablePosition | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleManualLiquidate = async (position: LiquidatablePosition) => {
    if (position.debts.length === 0 || position.collaterals.length === 0) return;
    
    setIsExecuting(true);
    const debt = position.debts[0];
    const collateral = position.collaterals[0];
    const maxDebt = parseFloat(debt.amount) * LIQUIDATION_CONFIG.MAX_CLOSE_FACTOR;
    
    await executeLiquidation(
      position.borrower,
      debt.token,
      maxDebt.toString(),
      collateral.token
    );
    setIsExecuting(false);
    setSelectedPosition(null);
  };

  return (
    <div className="bg-gray-800/80 rounded-xl border border-gray-700 p-4">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">🎯</span>
        Positions
      </h3>

      {/* Liquidatable */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <p className="text-sm font-medium text-red-400">
            Liquidatable ({liquidatablePositions.length})
          </p>
        </div>
        
        {liquidatablePositions.length === 0 ? (
          <p className="text-xs text-gray-500 py-2">No positions ready for liquidation</p>
        ) : (
          <div className="space-y-2">
            {liquidatablePositions.map((pos, i) => (
              <PositionCard 
                key={`liq-${i}`} 
                position={pos} 
                onLiquidate={() => setSelectedPosition(pos)}
                isLiquidatable
              />
            ))}
          </div>
        )}
      </div>

      {/* At Risk */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <p className="text-sm font-medium text-yellow-400">
            At Risk ({atRiskPositions.length})
          </p>
        </div>
        
        {atRiskPositions.length === 0 ? (
          <p className="text-xs text-gray-500 py-2">No positions at risk</p>
        ) : (
          <div className="space-y-2">
            {atRiskPositions.map((pos, i) => (
              <PositionCard 
                key={`risk-${i}`} 
                position={pos}
                isLiquidatable={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Liquidation Confirmation Modal */}
      {selectedPosition && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4">Confirm Liquidation</h3>
            
            <div className="bg-gray-900/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-400">Position</p>
              <p className="font-mono text-sm text-white truncate">{selectedPosition.borrower}</p>
              <p className="text-xs text-red-400">Health Factor: {selectedPosition.healthFactor.toFixed(4)}</p>
            </div>

            {selectedPosition.debts.length > 0 && selectedPosition.collaterals.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Transaction Preview</p>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-red-400">Pay Debt</p>
                    <p className="text-white">
                      {(parseFloat(selectedPosition.debts[0].amount) * LIQUIDATION_CONFIG.MAX_CLOSE_FACTOR).toFixed(4)} {selectedPosition.debts[0].symbol}
                    </p>
                  </div>
                  <span className="text-2xl">→</span>
                  <div className="text-right">
                    <p className="text-green-400">Receive Collateral</p>
                    <p className="text-white">
                      {selectedPosition.collaterals[0].symbol} (+5%)
                    </p>
                  </div>
                </div>
                <p className="text-xs text-green-400 text-center mt-2">
                  Potential Profit: ${selectedPosition.potentialProfit}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedPosition(null)}
                className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                disabled={isExecuting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleManualLiquidate(selectedPosition)}
                className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                disabled={isExecuting}
              >
                {isExecuting ? 'Executing...' : 'Execute Liquidation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Individual Position Card
function PositionCard({ 
  position, 
  onLiquidate,
  isLiquidatable 
}: { 
  position: LiquidatablePosition; 
  onLiquidate?: () => void;
  isLiquidatable: boolean;
}) {
  return (
    <div className={`rounded-lg p-3 border ${
      isLiquidatable 
        ? 'bg-red-500/10 border-red-500/30' 
        : 'bg-yellow-500/10 border-yellow-500/30'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-gray-400 truncate max-w-[120px]">
          {position.borrower.slice(0, 10)}...
        </span>
        <span className={`text-sm font-bold ${
          isLiquidatable ? 'text-red-400' : 'text-yellow-400'
        }`}>
          HF: {position.healthFactor.toFixed(4)}
        </span>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          Debt: ${position.totalDebtUSD}
        </span>
        <span className="text-gray-500">
          Collateral: ${position.totalCollateralUSD}
        </span>
      </div>

      {isLiquidatable && onLiquidate && (
        <div className="mt-2 pt-2 border-t border-gray-700/50 flex items-center justify-between">
          <span className="text-xs text-green-400">
            Profit: ${position.potentialProfit}
          </span>
          <button
            onClick={onLiquidate}
            className="text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
          >
            Liquidate
          </button>
        </div>
      )}
    </div>
  );
}

// Main Dashboard Component
export function LiquidatorDashboard() {
  const isAvailable = useIsLiquidatorBotAvailable();
  const { recentLiquidations } = useLiquidatorBot();

  if (!isAvailable) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 text-center">
        <p className="text-gray-400">Liquidator bot not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-white">Liquidator Dashboard</h2>
        <div className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-400">
          Simulation Mode
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Controls & Stats */}
        <div className="space-y-4">
          <BotControls />
          <LiquidatorStats />
        </div>

        {/* Middle Column - Positions */}
        <div>
          <LiquidatablePositionsList />
        </div>

        {/* Right Column - History */}
        <div className="bg-gray-800/80 rounded-xl border border-gray-700 p-4">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📜</span>
            Recent Liquidations
          </h3>
          <LiquidationHistoryList events={recentLiquidations} maxItems={5} />
        </div>
      </div>
    </div>
  );
}

export default LiquidatorDashboard;
