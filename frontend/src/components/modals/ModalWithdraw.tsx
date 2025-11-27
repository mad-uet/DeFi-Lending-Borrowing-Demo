'use client';

import { useState } from 'react';
import { UserSupply, TransactionStatus } from '@/types';
import { useWeb3 } from '@/hooks/useWeb3';
import { useUserAccountData } from '@/hooks/useUserAccountData';
import { useTransactionNotifications } from '@/hooks/useNotifications';
import { formatTokenAmount, formatUSD } from '@/lib/utils';
import { ADDRESSES } from '@/lib/contracts';
import TransactionPreview from '@/components/ui/TransactionPreview';
import toast from 'react-hot-toast';
import { parseUnits } from 'ethers';

interface ModalWithdrawProps {
  supply: UserSupply;
  onClose: () => void;
}

export default function ModalWithdraw({ supply, onClose }: ModalWithdrawProps) {
  const { account, signer } = useWeb3();
  const { accountData } = useUserAccountData();
  const { notifyTransactionSuccess, notifyTransactionError, notifyLiquidationRisk } = useTransactionNotifications();
  const [amount, setAmount] = useState('');
  const [acknowledgeRisk, setAcknowledgeRisk] = useState(false);
  const [status, setStatus] = useState<TransactionStatus>({
    status: 'idle',
    message: '',
  });

  const mockPrices: Record<string, number> = {
    WETH: 2000,
    DAI: 1,
    USDC: 1,
    LINK: 15,
  };

  const price = mockPrices[supply.asset.symbol] || 0;
  const usdValue = amount
    ? (parseFloat(amount) * price).toFixed(2)
    : '0.00';

  // Calculate health factor changes
  const { totalCollateralUSD, totalBorrowsUSD, ltv } = accountData;
  const withdrawUSD = parseFloat(usdValue) || 0;
  const newTotalCollateralUSD = Math.max(0, totalCollateralUSD - withdrawUSD);
  
  let currentHealthFactor = Infinity;
  let newHealthFactor = Infinity;
  
  if (totalBorrowsUSD > 0) {
    currentHealthFactor = (totalCollateralUSD * ltv) / totalBorrowsUSD;
    newHealthFactor = (newTotalCollateralUSD * ltv) / totalBorrowsUSD;
  }

  const isRisky = newHealthFactor < 1.2 && isFinite(newHealthFactor);
  const isLiquidationRisk = newHealthFactor < 1.0 && isFinite(newHealthFactor);

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!signer || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (isRisky && !acknowledgeRisk) {
      toast.error('Please acknowledge the risk before proceeding');
      return;
    }

    try {
      const { Contract } = await import('ethers');
      const { LENDING_POOL_ABI } = await import('@/lib/contracts');

      const amountWei = parseUnits(amount, supply.asset.decimals);

      setStatus({ status: 'pending', message: 'Withdrawing tokens...' });
      
      const lendingPoolContract = new Contract(ADDRESSES.LendingPool, LENDING_POOL_ABI, signer);
      const tx = await lendingPoolContract.withdraw(supply.asset.address, amountWei);
      
      toast.loading('Withdrawing tokens...', { id: 'withdraw' });
      const receipt = await tx.wait();
      
      setStatus({
        status: 'success',
        message: `Successfully withdrawn ${amount} ${supply.asset.symbol}!`,
        hash: receipt.hash,
      });
      
      toast.success(`Successfully withdrawn ${amount} ${supply.asset.symbol}!`, { id: 'withdraw' });
      notifyTransactionSuccess('Withdraw', supply.asset.symbol, amount, receipt.hash);

      if (newHealthFactor < 1.2 && isFinite(newHealthFactor)) {
        notifyLiquidationRisk(newHealthFactor);
      }
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Withdraw error:', error);
      setStatus({
        status: 'error',
        message: error.message || 'Transaction failed',
        error: error.message,
      });
      toast.error(error.message || 'Transaction failed', { id: 'withdraw' });
      notifyTransactionError('Withdraw', error.message || 'Transaction failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-2xl">📤</span>
            Withdraw {supply.asset.symbol}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            disabled={status.status === 'pending'}
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Amount input */}
          <div>
            <label className="block text-sm font-medium mb-2">Amount to Withdraw</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setAcknowledgeRisk(false);
                }}
                placeholder="0.0"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg"
                disabled={status.status !== 'idle'}
              />
              <button
                onClick={() => setAmount(supply.supplied)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 rounded text-sm font-semibold hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                disabled={status.status !== 'idle'}
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>≈ ${usdValue}</span>
              <span>
                Supplied: {formatTokenAmount(supply.supplied, supply.asset.decimals)} {supply.asset.symbol}
              </span>
            </div>
          </div>

          {/* Transaction Preview */}
          <TransactionPreview
            type="withdraw"
            amount={amount}
            symbol={supply.asset.symbol}
            decimals={supply.asset.decimals}
            currentHealthFactor={currentHealthFactor}
            newHealthFactor={newHealthFactor}
            currentWalletBalance="0"
            currentPoolBalance={supply.supplied}
            gasEstimate="~0.003 ETH"
          >
            {/* Risk acknowledgment checkbox */}
            {isRisky && parseFloat(amount) > 0 && (
              <label className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={acknowledgeRisk}
                  onChange={(e) => setAcknowledgeRisk(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-red-800 dark:text-red-200">
                  <strong>I understand the risks.</strong> Withdrawing this amount will reduce my collateral 
                  and {isLiquidationRisk ? 'immediately put my position at liquidation risk' : 'lower my health factor significantly'}.
                </span>
              </label>
            )}
          </TransactionPreview>

          {/* LAR info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>LAR Earned</span>
              <span className="font-semibold text-primary-600">
                {formatTokenAmount(supply.larEarned, 18)} LAR
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              LAR rewards will be claimed automatically
            </div>
          </div>

          {/* Status message */}
          {status.status !== 'idle' && (
            <div className={`p-3 rounded-lg ${
              status.status === 'success' ? 'bg-green-50 text-green-800' :
              status.status === 'error' ? 'bg-red-50 text-red-800' :
              'bg-blue-50 text-blue-800'
            }`}>
              {status.status === 'pending' ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>{status.message}</span>
                </div>
              ) : (
                <span>{status.message}</span>
              )}
            </div>
          )}

          {/* Action button */}
          <button
            onClick={handleWithdraw}
            disabled={
              !amount ||
              parseFloat(amount) <= 0 ||
              parseFloat(amount) > parseFloat(supply.supplied) ||
              (isRisky && !acknowledgeRisk) ||
              status.status !== 'idle'
            }
            className={`w-full px-6 py-4 font-semibold rounded-lg transition-all transform hover:scale-[1.02] ${
              isLiquidationRisk 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-yellow-500 hover:bg-yellow-600'
            } disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none text-white text-lg`}
          >
            {status.status === 'idle' 
              ? isLiquidationRisk 
                ? '⚠️ Withdraw (High Risk)' 
                : 'Withdraw' 
              : status.status === 'success' 
                ? '✓ Success' 
                : 'Processing...'}
          </button>
        </div>
      </div>
    </div>
  );
}
