'use client';

import { useState } from 'react';
import { BorrowAsset, TransactionStatus } from '@/types';
import { useWeb3 } from '@/hooks/useWeb3';
import { useUserAccountData } from '@/hooks/useUserAccountData';
import { useTransactionNotifications } from '@/hooks/useNotifications';
import { formatTokenAmount } from '@/lib/utils';
import { ADDRESSES } from '@/lib/contracts';
import TransactionPreview from '@/components/ui/TransactionPreview';
import { SimpleTransactionProgress, useTransactionProgress } from '@/components/ui/TransactionProgress';
import toast from 'react-hot-toast';
import { parseUnits } from 'ethers';

interface ModalBorrowProps {
  asset: BorrowAsset;
  onClose: () => void;
}

export default function ModalBorrow({ asset, onClose }: ModalBorrowProps) {
  const { account, signer } = useWeb3();
  const { accountData } = useUserAccountData();
  const { notifyTransactionSuccess, notifyTransactionError, notifyLiquidationRisk } = useTransactionNotifications();
  const [amount, setAmount] = useState('');
  const [acknowledgeRisk, setAcknowledgeRisk] = useState(false);
  const [status, setStatus] = useState<TransactionStatus>({
    status: 'idle',
    message: '',
  });
  const txProgress = useTransactionProgress();

  const handleBorrow = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!signer || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    // Check if user acknowledged risk for risky transactions
    if (isRisky && !acknowledgeRisk) {
      toast.error('Please acknowledge the risk before proceeding');
      return;
    }

    try {
      const { Contract } = await import('ethers');
      const { LENDING_POOL_ABI } = await import('@/lib/contracts');

      const amountWei = parseUnits(amount, asset.decimals);

      setStatus({ status: 'pending', message: 'Borrowing tokens...' });
      txProgress.startTransaction();
      
      // Step 1: Confirm in wallet
      txProgress.setConfirming();
      const lendingPoolContract = new Contract(ADDRESSES.LendingPool, LENDING_POOL_ABI, signer);
      const tx = await lendingPoolContract.borrow(asset.address, amountWei);
      
      // Step 2: Executing on-chain
      txProgress.setExecuting(tx.hash);
      toast.loading('Borrowing tokens...', { id: 'borrow' });
      const receipt = await tx.wait();
      
      // Step 3: Complete
      txProgress.complete(receipt.hash);
      setStatus({
        status: 'success',
        message: `Successfully borrowed ${amount} ${asset.symbol}!`,
        hash: receipt.hash,
      });
      
      toast.success(`Successfully borrowed ${amount} ${asset.symbol}!`, { id: 'borrow' });
      notifyTransactionSuccess('Borrow', asset.symbol, amount, receipt.hash);

      // Alert if new position is risky
      if (newHealthFactor < 1.2 && isFinite(newHealthFactor)) {
        notifyLiquidationRisk(newHealthFactor);
      }
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Borrow error:', error);
      txProgress.fail(error.message || 'Transaction failed');
      setStatus({
        status: 'error',
        message: error.message || 'Transaction failed',
        error: error.message,
      });
      toast.error(error.message || 'Transaction failed', { id: 'borrow' });
      notifyTransactionError('Borrow', error.message || 'Transaction failed');
    }
  };

  const mockPrices: Record<string, number> = {
    WETH: 2000,
    DAI: 1,
    USDC: 1,
    LINK: 15,
  };

  const price = mockPrices[asset.symbol] || 0;
  const usdValue = amount ? (parseFloat(amount) * price).toFixed(2) : '0.00';

  // Calculate new health factor using real account data
  const { totalCollateralUSD, totalBorrowsUSD, ltv } = accountData;
  const newBorrowUSD = parseFloat(usdValue) || 0;
  const newTotalBorrowsUSD = totalBorrowsUSD + newBorrowUSD;
  
  // Health Factor = (Collateral * LTV) / Total Borrows
  let newHealthFactor = Infinity;
  if (newTotalBorrowsUSD > 0) {
    newHealthFactor = (totalCollateralUSD * ltv) / newTotalBorrowsUSD;
  }

  // Current health factor for display
  let currentHealthFactor = Infinity;
  if (totalBorrowsUSD > 0) {
    currentHealthFactor = (totalCollateralUSD * ltv) / totalBorrowsUSD;
  }

  const isRisky = newHealthFactor < 1.2 && isFinite(newHealthFactor);
  const isLiquidationRisk = newHealthFactor < 1.0 && isFinite(newHealthFactor);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-2xl">💰</span>
            Borrow {asset.symbol}
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
            <label className="block text-sm font-medium mb-2">Amount to Borrow</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setAcknowledgeRisk(false); // Reset acknowledgment when amount changes
                }}
                placeholder="0.0"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                disabled={status.status !== 'idle'}
              />
              <button
                onClick={() => setAmount(asset.maxBorrow)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded text-sm font-semibold hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                disabled={status.status !== 'idle'}
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>≈ ${usdValue}</span>
              <span>
                Max: {formatTokenAmount(asset.maxBorrow, asset.decimals)} {asset.symbol}
              </span>
            </div>
          </div>

          {/* Transaction Preview */}
          <TransactionPreview
            type="borrow"
            amount={amount}
            symbol={asset.symbol}
            decimals={asset.decimals}
            currentHealthFactor={currentHealthFactor}
            newHealthFactor={newHealthFactor}
            currentWalletBalance="0" // Would be fetched from wallet
            currentPoolBalance={asset.availableToBorrow}
            currentBorrowed={asset.yourBorrows}
            gasEstimate="~0.005 ETH"
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
                  <strong>I understand the risks.</strong> I acknowledge that this transaction will put my 
                  position at {isLiquidationRisk ? 'immediate liquidation' : 'high'} risk and I may lose 
                  my collateral if market conditions change.
                </span>
              </label>
            )}
          </TransactionPreview>

          {/* Info section */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Borrow APY</span>
              <span className="font-semibold text-red-600">{asset.borrowAPY}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Available Liquidity</span>
              <span className="font-semibold">
                {formatTokenAmount(asset.availableToBorrow, asset.decimals)} {asset.symbol}
              </span>
            </div>
          </div>

          {/* Liquidity warnings */}
          {parseFloat(asset.availableToBorrow) === 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                ❌ No liquidity available. This asset has no deposits in the pool to borrow from.
              </p>
            </div>
          )}

          {amount && parseFloat(amount) > parseFloat(asset.availableToBorrow) && parseFloat(asset.availableToBorrow) > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                ❌ Insufficient liquidity. Only {formatTokenAmount(asset.availableToBorrow, asset.decimals)} {asset.symbol} available in the pool.
              </p>
            </div>
          )}

          {/* Status message with Transaction Progress */}
          {txProgress.isInProgress && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <SimpleTransactionProgress
                phase={txProgress.phase}
                txHash={txProgress.txHash}
                errorMessage={txProgress.errorMessage}
                onCancel={() => {
                  txProgress.reset();
                  setStatus({ status: 'idle', message: '' });
                }}
                size="sm"
              />
            </div>
          )}
          
          {txProgress.isComplete && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <SimpleTransactionProgress
                phase={txProgress.phase}
                txHash={txProgress.txHash}
                size="sm"
              />
            </div>
          )}
          
          {txProgress.isError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <SimpleTransactionProgress
                phase={txProgress.phase}
                errorMessage={txProgress.errorMessage}
                size="sm"
              />
              <button
                onClick={() => {
                  txProgress.reset();
                  setStatus({ status: 'idle', message: '' });
                }}
                className="mt-3 w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Action button */}
          <button
            onClick={handleBorrow}
            disabled={
              !amount ||
              parseFloat(amount) <= 0 ||
              parseFloat(amount) > parseFloat(asset.maxBorrow) ||
              parseFloat(amount) > parseFloat(asset.availableToBorrow) ||
              (isRisky && !acknowledgeRisk) ||
              txProgress.isInProgress ||
              txProgress.isComplete
            }
            className={`w-full px-6 py-4 font-semibold rounded-lg transition-all transform hover:scale-[1.02] ${
              isLiquidationRisk 
                ? 'bg-red-500 hover:bg-red-600 disabled:bg-gray-300' 
                : 'bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300'
            } disabled:cursor-not-allowed disabled:transform-none text-white text-lg`}
          >
            {txProgress.phase === 'idle' 
              ? isLiquidationRisk 
                ? '⚠️ Borrow (High Risk)' 
                : 'Borrow' 
              : txProgress.isComplete 
                ? '✓ Success' 
                : 'Processing...'}
          </button>
        </div>
      </div>
    </div>
  );
}
