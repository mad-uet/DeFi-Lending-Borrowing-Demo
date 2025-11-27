'use client';

import { useState } from 'react';
import { UserBorrow, TransactionStatus } from '@/types';
import { useWeb3 } from '@/hooks/useWeb3';
import { useUserAccountData } from '@/hooks/useUserAccountData';
import { useTransactionNotifications } from '@/hooks/useNotifications';
import { formatTokenAmount, formatUSD } from '@/lib/utils';
import { ADDRESSES } from '@/lib/contracts';
import TransactionPreview from '@/components/ui/TransactionPreview';
import toast from 'react-hot-toast';
import { parseUnits } from 'ethers';

interface ModalRepayProps {
  borrow: UserBorrow;
  onClose: () => void;
}

export default function ModalRepay({ borrow, onClose }: ModalRepayProps) {
  const { account, signer } = useWeb3();
  const { accountData } = useUserAccountData();
  const { notifyTransactionSuccess, notifyTransactionError } = useTransactionNotifications();
  const [amount, setAmount] = useState('');
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

  const price = mockPrices[borrow.asset.symbol] || 0;
  const usdValue = amount
    ? (parseFloat(amount) * price).toFixed(2)
    : '0.00';

  // Calculate health factor changes
  const { totalCollateralUSD, totalBorrowsUSD, ltv } = accountData;
  const repayUSD = parseFloat(usdValue) || 0;
  const newTotalBorrowsUSD = Math.max(0, totalBorrowsUSD - repayUSD);
  
  let currentHealthFactor = Infinity;
  let newHealthFactor = Infinity;
  
  if (totalBorrowsUSD > 0) {
    currentHealthFactor = (totalCollateralUSD * ltv) / totalBorrowsUSD;
  }
  if (newTotalBorrowsUSD > 0) {
    newHealthFactor = (totalCollateralUSD * ltv) / newTotalBorrowsUSD;
  }

  const isFullRepayment = parseFloat(amount) >= parseFloat(borrow.totalDebt);

  const handleRepay = async () => {
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

      const amountWei = parseUnits(amount, borrow.asset.decimals);

      // Step 1: Approve
      setStatus({ status: 'approving', message: 'Approving tokens...' });
      const tokenContract = new Contract(borrow.asset.address, ERC20_ABI, signer);
      
      const currentAllowance = await tokenContract.allowance(account, ADDRESSES.LendingPool);
      
      if (currentAllowance < amountWei) {
        const approveTx = await tokenContract.approve(ADDRESSES.LendingPool, amountWei);
        toast.loading('Approving tokens...', { id: 'approve' });
        await approveTx.wait();
        toast.success('Tokens approved!', { id: 'approve' });
      }

      // Step 2: Repay
      setStatus({ status: 'pending', message: 'Repaying loan...' });
      
      const lendingPoolContract = new Contract(ADDRESSES.LendingPool, LENDING_POOL_ABI, signer);
      const tx = await lendingPoolContract.repay(borrow.asset.address, amountWei);
      
      toast.loading('Repaying loan...', { id: 'repay' });
      const receipt = await tx.wait();
      
      setStatus({
        status: 'success',
        message: `Successfully repaid ${amount} ${borrow.asset.symbol}!`,
        hash: receipt.hash,
      });
      
      toast.success(`Successfully repaid ${amount} ${borrow.asset.symbol}!`, { id: 'repay' });
      notifyTransactionSuccess('Repay', borrow.asset.symbol, amount, receipt.hash);
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Repay error:', error);
      setStatus({
        status: 'error',
        message: error.message || 'Transaction failed',
        error: error.message,
      });
      toast.error(error.message || 'Transaction failed', { id: 'repay' });
      notifyTransactionError('Repay', error.message || 'Transaction failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-2xl">✅</span>
            Repay {borrow.asset.symbol}
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
            <label className="block text-sm font-medium mb-2">Amount to Repay</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                disabled={status.status !== 'idle'}
              />
              <button
                onClick={() => setAmount(borrow.totalDebt)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded text-sm font-semibold hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                disabled={status.status !== 'idle'}
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>≈ ${usdValue}</span>
              <span>
                Total Debt: {formatTokenAmount(borrow.totalDebt, borrow.asset.decimals)} {borrow.asset.symbol}
              </span>
            </div>
          </div>

          {/* Transaction Preview */}
          <TransactionPreview
            type="repay"
            amount={amount}
            symbol={borrow.asset.symbol}
            decimals={borrow.asset.decimals}
            currentHealthFactor={currentHealthFactor}
            newHealthFactor={newHealthFactor}
            currentWalletBalance="0"
            currentPoolBalance="0"
            currentBorrowed={borrow.borrowed}
            gasEstimate="~0.004 ETH"
          />

          {/* Debt breakdown */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Principal</span>
              <span>{formatTokenAmount(borrow.borrowed, borrow.asset.decimals)} {borrow.asset.symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Accrued Interest</span>
              <span className="text-red-600">
                {formatTokenAmount(borrow.accruedInterest, borrow.asset.decimals)} {borrow.asset.symbol}
              </span>
            </div>
            <div className="border-t border-gray-300 dark:border-gray-600 pt-2 flex justify-between font-semibold">
              <span>Total Debt</span>
              <span>{formatTokenAmount(borrow.totalDebt, borrow.asset.decimals)} {borrow.asset.symbol}</span>
            </div>
          </div>

          {/* Full repayment celebration */}
          {isFullRepayment && parseFloat(amount) > 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="text-3xl animate-bounce-subtle">🎉</span>
                <div>
                  <h4 className="font-bold text-green-800 dark:text-green-200">Full Debt Repayment!</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    This will clear your entire debt for {borrow.asset.symbol}. Great job!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info tip */}
          {!isFullRepayment && parseFloat(amount) > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 Repaying your loan will improve your health factor and reduce interest charges.
              </p>
            </div>
          )}

          {/* Status message */}
          {status.status !== 'idle' && (
            <div className={`p-3 rounded-lg ${
              status.status === 'success' ? 'bg-green-50 text-green-800' :
              status.status === 'error' ? 'bg-red-50 text-red-800' :
              'bg-blue-50 text-blue-800'
            }`}>
              {status.status === 'approving' || status.status === 'pending' ? (
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
            onClick={handleRepay}
            disabled={
              !amount ||
              parseFloat(amount) <= 0 ||
              parseFloat(amount) > parseFloat(borrow.totalDebt) ||
              status.status !== 'idle'
            }
            className="w-full px-6 py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] disabled:transform-none text-lg"
          >
            {status.status === 'idle' 
              ? isFullRepayment 
                ? '🎉 Repay Full Debt' 
                : 'Repay' 
              : status.status === 'success' 
                ? '✓ Success' 
                : 'Processing...'}
          </button>
        </div>
      </div>
    </div>
  );
}
