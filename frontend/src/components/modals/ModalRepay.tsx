'use client';

import { useState } from 'react';
import { UserBorrow, TransactionStatus } from '@/types';
import { useWeb3 } from '@/hooks/useWeb3';
import { formatTokenAmount, formatUSD } from '@/lib/utils';
import { ADDRESSES } from '@/lib/contracts';
import toast from 'react-hot-toast';
import { parseUnits } from 'ethers';

interface ModalRepayProps {
  borrow: UserBorrow;
  onClose: () => void;
}

export default function ModalRepay({ borrow, onClose }: ModalRepayProps) {
  const { account, signer } = useWeb3();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<TransactionStatus>({
    status: 'idle',
    message: '',
  });

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
    }
  };

  const mockPrices: Record<string, number> = {
    WETH: 2000,
    DAI: 1,
    USDC: 1,
    LINK: 15,
  };

  const usdValue = amount
    ? (parseFloat(amount) * (mockPrices[borrow.asset.symbol] || 0)).toFixed(2)
    : '0.00';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Repay {borrow.asset.symbol}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={status.status === 'approving' || status.status === 'pending'}
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Amount</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={status.status !== 'idle'}
            />
            <button
              onClick={() => setAmount(borrow.totalDebt)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded text-sm font-semibold hover:bg-primary-200 dark:hover:bg-primary-800"
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

        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
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

        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 Repaying your loan will improve your health factor and reduce interest charges.
          </p>
        </div>

        {status.status !== 'idle' && (
          <div className={`mb-4 p-3 rounded-lg ${
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

        <button
          onClick={handleRepay}
          disabled={
            !amount ||
            parseFloat(amount) <= 0 ||
            parseFloat(amount) > parseFloat(borrow.totalDebt) ||
            status.status !== 'idle'
          }
          className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          {status.status === 'idle' ? 'Repay' : status.status === 'success' ? '✓ Success' : 'Processing...'}
        </button>
      </div>
    </div>
  );
}
