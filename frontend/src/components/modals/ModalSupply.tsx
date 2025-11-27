'use client';

import { useState, useEffect } from 'react';
import { SupplyAsset, TransactionStatus } from '@/types';
import { useWeb3 } from '@/hooks/useWeb3';
import { useContract } from '@/hooks/useContract';
import { useUserAccountData } from '@/hooks/useUserAccountData';
import { useTransactionNotifications } from '@/hooks/useNotifications';
import { formatTokenAmount, formatUSD, parseTokenAmount } from '@/lib/utils';
import { ADDRESSES } from '@/lib/contracts';
import TransactionPreview from '@/components/ui/TransactionPreview';
import { ApprovalTransactionProgress, useTransactionProgress } from '@/components/ui/TransactionProgress';
import toast from 'react-hot-toast';
import { parseUnits } from 'ethers';

interface ModalSupplyProps {
  asset: SupplyAsset;
  onClose: () => void;
}

export default function ModalSupply({ asset, onClose }: ModalSupplyProps) {
  const { account, signer } = useWeb3();
  const { accountData } = useUserAccountData();
  const { notifyTransactionSuccess, notifyTransactionError } = useTransactionNotifications();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<TransactionStatus>({
    status: 'idle',
    message: '',
  });
  const txProgress = useTransactionProgress();

  const handleSupply = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!signer || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const { Contract } = await import('ethers');
      const { ERC20_ABI, LENDING_POOL_ABI } = await import('@/lib/contracts');

      const amountWei = parseUnits(amount, asset.decimals);

      // Step 1: Approve
      txProgress.startTransaction();
      txProgress.setApproving();
      setStatus({ status: 'approving', message: 'Approving tokens...' });
      const tokenContract = new Contract(asset.address, ERC20_ABI, signer);
      
      // Check current allowance
      const currentAllowance = await tokenContract.allowance(account, ADDRESSES.LendingPool);
      
      if (currentAllowance < amountWei) {
        const approveTx = await tokenContract.approve(ADDRESSES.LendingPool, amountWei);
        toast.loading('Approving tokens...', { id: 'approve' });
        await approveTx.wait();
        toast.success('Tokens approved!', { id: 'approve' });
      }

      // Step 2: Confirm deposit
      txProgress.setConfirming();
      setStatus({ status: 'pending', message: 'Depositing tokens...' });
      const lendingPoolContract = new Contract(ADDRESSES.LendingPool, LENDING_POOL_ABI, signer);
      
      const depositTx = await lendingPoolContract.deposit(asset.address, amountWei);
      
      // Step 3: Executing
      txProgress.setExecuting(depositTx.hash);
      toast.loading('Depositing tokens...', { id: 'deposit' });
      
      const receipt = await depositTx.wait();
      
      // Step 4: Complete
      txProgress.complete(receipt.hash);
      setStatus({
        status: 'success',
        message: `Successfully deposited ${amount} ${asset.symbol}!`,
        hash: receipt.hash,
      });
      
      toast.success(`Successfully deposited ${amount} ${asset.symbol}!`, { id: 'deposit' });
      notifyTransactionSuccess('Supply', asset.symbol, amount, receipt.hash);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Supply error:', error);
      txProgress.fail(error.message || 'Transaction failed');
      setStatus({
        status: 'error',
        message: error.message || 'Transaction failed',
        error: error.message,
      });
      toast.error(error.message || 'Transaction failed', { id: 'deposit' });
      notifyTransactionError('Supply', error.message || 'Transaction failed');
    }
  };

  const mockPrices: Record<string, number> = {
    WETH: 2000,
    DAI: 1,
    USDC: 1,
    LINK: 15,
  };

  const price = mockPrices[asset.symbol] || 0;
  const usdValue = amount
    ? (parseFloat(amount) * price).toFixed(2)
    : '0.00';

  // Calculate health factor changes
  const { totalCollateralUSD, totalBorrowsUSD, ltv } = accountData;
  const newCollateralUSD = parseFloat(usdValue) || 0;
  const newTotalCollateralUSD = totalCollateralUSD + newCollateralUSD;
  
  let currentHealthFactor = Infinity;
  let newHealthFactor = Infinity;
  
  if (totalBorrowsUSD > 0) {
    currentHealthFactor = (totalCollateralUSD * ltv) / totalBorrowsUSD;
    newHealthFactor = (newTotalCollateralUSD * ltv) / totalBorrowsUSD;
  }

  // Estimate LAR rewards
  const estimatedLAR = amount ? (parseFloat(usdValue)).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-2xl">📥</span>
            Supply {asset.symbol}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            disabled={status.status === 'approving' || status.status === 'pending'}
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Amount input */}
          <div>
            <label className="block text-sm font-medium mb-2">Amount to Supply</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                disabled={status.status !== 'idle'}
              />
              <button
                onClick={() => setAmount(asset.walletBalance)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded text-sm font-semibold hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                disabled={status.status !== 'idle'}
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>≈ ${usdValue}</span>
              <span>
                Balance: {formatTokenAmount(asset.walletBalance, asset.decimals)} {asset.symbol}
              </span>
            </div>
          </div>

          {/* Transaction Preview */}
          <TransactionPreview
            type="supply"
            amount={amount}
            symbol={asset.symbol}
            decimals={asset.decimals}
            currentHealthFactor={currentHealthFactor}
            newHealthFactor={newHealthFactor}
            currentWalletBalance={asset.walletBalance}
            currentPoolBalance={asset.totalSupplied}
            gasEstimate="~0.003 ETH"
          />

          {/* Rewards & APY info */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
              <span>🎁</span> Rewards & Earnings
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-700 dark:text-green-300">Supply APY</span>
                <span className="font-semibold text-green-600">{asset.supplyAPY}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700 dark:text-green-300">LAR Rewards (estimated)</span>
                <span className="font-semibold text-primary-600">
                  {estimatedLAR} LAR
                </span>
              </div>
            </div>
          </div>

          {/* Status message with Transaction Progress */}
          {txProgress.isInProgress && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <ApprovalTransactionProgress
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
              <ApprovalTransactionProgress
                phase={txProgress.phase}
                txHash={txProgress.txHash}
                size="sm"
              />
            </div>
          )}
          
          {txProgress.isError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <ApprovalTransactionProgress
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
            onClick={handleSupply}
            disabled={
              !amount ||
              parseFloat(amount) <= 0 ||
              parseFloat(amount) > parseFloat(asset.walletBalance) ||
              txProgress.isInProgress ||
              txProgress.isComplete
            }
            className="w-full px-6 py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] disabled:transform-none text-lg"
          >
            {txProgress.phase === 'idle' ? 'Supply' : txProgress.isComplete ? '✓ Success' : 'Processing...'}
          </button>
        </div>
      </div>
    </div>
  );
}
