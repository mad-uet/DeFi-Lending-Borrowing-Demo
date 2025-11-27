'use client';

import { useState } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import { useEducationalMode } from '@/hooks/useEducationalMode';

const MOCK_PRICES: Record<string, number> = {
  WETH: 2000,
  DAI: 1,
  USDC: 1,
  LINK: 15,
};

interface SimulatedActionModalProps {
  type: 'supply' | 'withdraw' | 'borrow' | 'repay';
  symbol: string;
  onClose: () => void;
}

export default function SimulatedActionModal({ type, symbol, onClose }: SimulatedActionModalProps) {
  const {
    simulatedBalances,
    simulateSupply,
    simulateWithdraw,
    simulateBorrow,
    simulateRepay,
    getSimulatedHealthFactor,
    getSimulatedTotalCollateral,
    getSimulatedTotalBorrows,
  } = useSimulation();
  const { isEnabled: isEducationalMode } = useEducationalMode();

  const [amount, setAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);

  const balance = simulatedBalances[symbol];
  const price = MOCK_PRICES[symbol] || 0;
  const amountNum = parseFloat(amount) || 0;
  const usdValue = amountNum * price;

  // Calculate max amounts
  const getMaxAmount = () => {
    switch (type) {
      case 'supply':
        return balance?.wallet || 0;
      case 'withdraw':
        return balance?.supplied || 0;
      case 'borrow':
        const totalCollateral = getSimulatedTotalCollateral();
        const totalBorrows = getSimulatedTotalBorrows();
        const maxBorrowValue = totalCollateral * 0.75 - totalBorrows;
        return Math.max(0, maxBorrowValue / price);
      case 'repay':
        return Math.min(balance?.wallet || 0, balance?.borrowed || 0);
      default:
        return 0;
    }
  };

  // Calculate new health factor
  const calculateNewHealthFactor = () => {
    let newCollateral = getSimulatedTotalCollateral();
    let newBorrows = getSimulatedTotalBorrows();

    switch (type) {
      case 'supply':
        newCollateral += usdValue;
        break;
      case 'withdraw':
        newCollateral -= usdValue;
        break;
      case 'borrow':
        newBorrows += usdValue;
        break;
      case 'repay':
        newBorrows -= usdValue;
        break;
    }

    if (newBorrows <= 0) return Infinity;
    return (newCollateral * 0.75) / newBorrows;
  };

  const currentHF = getSimulatedHealthFactor();
  const newHF = calculateNewHealthFactor();
  const hfChange = newHF - currentHF;

  const handleExecute = () => {
    setShowError(null);
    let success = false;

    switch (type) {
      case 'supply':
        success = simulateSupply(symbol, amountNum);
        break;
      case 'withdraw':
        success = simulateWithdraw(symbol, amountNum);
        break;
      case 'borrow':
        success = simulateBorrow(symbol, amountNum);
        break;
      case 'repay':
        success = simulateRepay(symbol, amountNum);
        break;
    }

    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setShowError(getErrorMessage());
    }
  };

  const getErrorMessage = () => {
    switch (type) {
      case 'supply':
        return 'Insufficient wallet balance';
      case 'withdraw':
        return 'Would cause liquidation or insufficient supply';
      case 'borrow':
        return 'Exceeds borrowing capacity';
      case 'repay':
        return 'Insufficient balance or no debt';
      default:
        return 'Transaction failed';
    }
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'supply':
        return { icon: '📥', color: 'green', label: 'Supply' };
      case 'withdraw':
        return { icon: '📤', color: 'amber', label: 'Withdraw' };
      case 'borrow':
        return { icon: '💰', color: 'purple', label: 'Borrow' };
      case 'repay':
        return { icon: '✅', color: 'blue', label: 'Repay' };
    }
  };

  const config = getTypeConfig();
  const maxAmount = getMaxAmount();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Simulation Banner */}
        <div className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-center text-sm font-semibold">
          🧪 Simulation Mode - No Real Tokens Used
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>{config.icon}</span>
            Simulate {config.label} {symbol}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Success State */}
          {showSuccess && (
            <div className="p-6 text-center">
              <div className="text-5xl mb-4 animate-bounce">✅</div>
              <h3 className="text-xl font-bold text-green-600">Simulation Successful!</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {config.label}ed {amountNum.toFixed(4)} {symbol}
              </p>
            </div>
          )}

          {!showSuccess && (
            <>
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg"
                  />
                  <button
                    onClick={() => setAmount(maxAmount.toFixed(4))}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm font-semibold rounded bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-600`}
                  >
                    MAX
                  </button>
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                  <span>≈ ${usdValue.toFixed(2)}</span>
                  <span>Max: {maxAmount.toFixed(4)} {symbol}</span>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Transaction Preview
                </h4>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Health Factor</span>
                  <div className="flex items-center gap-2">
                    <span className={
                      !isFinite(currentHF) || currentHF > 2 ? 'text-green-600' :
                      currentHF > 1.5 ? 'text-amber-600' : 'text-red-600'
                    }>
                      {isFinite(currentHF) ? currentHF.toFixed(2) : '∞'}
                    </span>
                    <span>→</span>
                    <span className={
                      !isFinite(newHF) || newHF > 2 ? 'text-green-600' :
                      newHF > 1.5 ? 'text-amber-600' : 'text-red-600'
                    }>
                      {isFinite(newHF) ? newHF.toFixed(2) : '∞'}
                    </span>
                    {isFinite(hfChange) && amountNum > 0 && (
                      <span className={hfChange >= 0 ? 'text-green-500 text-xs' : 'text-red-500 text-xs'}>
                        ({hfChange >= 0 ? '+' : ''}{hfChange.toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Warning for risky transactions */}
                {isFinite(newHF) && newHF < 1.5 && amountNum > 0 && (
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-xs text-red-700 dark:text-red-300">
                      ⚠️ This would put your position at liquidation risk!
                    </p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {showError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">❌ {showError}</p>
                </div>
              )}

              {/* Educational Info */}
              {isEducationalMode && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    💡 <strong>Learning Tip:</strong> {
                      type === 'supply' ? 'Supplying assets increases your collateral and earning potential.' :
                      type === 'withdraw' ? 'Withdrawing reduces your collateral - watch your health factor!' :
                      type === 'borrow' ? 'Borrowing uses your collateral. Keep health factor above 1.5 for safety.' :
                      'Repaying debt improves your health factor and reduces interest costs.'
                    }
                  </p>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleExecute}
                disabled={amountNum <= 0 || amountNum > maxAmount}
                className={`w-full px-6 py-4 font-semibold rounded-lg text-white transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-r ${
                  config.color === 'green' ? 'from-green-500 to-green-600' :
                  config.color === 'amber' ? 'from-amber-500 to-amber-600' :
                  config.color === 'purple' ? 'from-purple-500 to-purple-600' :
                  'from-blue-500 to-blue-600'
                }`}
              >
                🧪 Simulate {config.label}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Quick simulate buttons for each token
export function SimulateQuickActions({ symbol }: { symbol: string }) {
  const [activeModal, setActiveModal] = useState<'supply' | 'withdraw' | 'borrow' | 'repay' | null>(null);
  const { isSimulationMode, simulatedBalances } = useSimulation();

  if (!isSimulationMode) return null;

  const balance = simulatedBalances[symbol];

  return (
    <>
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => setActiveModal('supply')}
          className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
        >
          📥 Supply
        </button>
        {(balance?.supplied || 0) > 0 && (
          <button
            onClick={() => setActiveModal('withdraw')}
            className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
          >
            📤 Withdraw
          </button>
        )}
        <button
          onClick={() => setActiveModal('borrow')}
          className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
        >
          💰 Borrow
        </button>
        {(balance?.borrowed || 0) > 0 && (
          <button
            onClick={() => setActiveModal('repay')}
            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            ✅ Repay
          </button>
        )}
      </div>

      {activeModal && (
        <SimulatedActionModal
          type={activeModal}
          symbol={symbol}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  );
}
