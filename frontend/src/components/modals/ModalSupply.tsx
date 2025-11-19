'use client';

import { useState, useEffect } from 'react';
import { SupplyAsset, TransactionStatus } from '@/types';
import { useWeb3 } from '@/hooks/useWeb3';
import { useContract } from '@/hooks/useContract';
import { formatTokenAmount, formatUSD, parseTokenAmount } from '@/lib/utils';
import { ADDRESSES } from '@/lib/contracts';
import toast from 'react-hot-toast';
import { parseUnits } from 'ethers';

interface ModalSupplyProps {
  asset: SupplyAsset;
  onClose: () => void;
}

export default function ModalSupply({ asset, onClose }: ModalSupplyProps) {
  const { account, signer } = useWeb3();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<TransactionStatus>({
    status: 'idle',
    message: '',
  });

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

      // Step 2: Deposit
      setStatus({ status: 'pending', message: 'Depositing tokens...' });
      const lendingPoolContract = new Contract(ADDRESSES.LendingPool, LENDING_POOL_ABI, signer);
      
      const depositTx = await lendingPoolContract.deposit(asset.address, amountWei);
      toast.loading('Depositing tokens...', { id: 'deposit' });
      
      const receipt = await depositTx.wait();
      
      setStatus({
        status: 'success',
        message: `Successfully deposited ${amount} ${asset.symbol}!`,
        hash: receipt.hash,
      });
      
      toast.success(`Successfully deposited ${amount} ${asset.symbol}!`, { id: 'deposit' });
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Supply error:', error);
      setStatus({
        status: 'error',
        message: error.message || 'Transaction failed',
        error: error.message,
      });
      toast.error(error.message || 'Transaction failed', { id: 'deposit' });
    }
  };

  const mockPrices: Record<string, number> = {
    WETH: 2000,
    DAI: 1,
    USDC: 1,
    LINK: 15,
  };

  const usdValue = amount
    ? (parseFloat(amount) * (mockPrices[asset.symbol] || 0)).toFixed(2)
    : '0.00';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Supply {asset.symbol}</h2>
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
              onClick={() => setAmount(asset.walletBalance)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded text-sm font-semibold hover:bg-primary-200 dark:hover:bg-primary-800"
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

        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Supply APY</span>
            <span className="font-semibold text-green-600">{asset.supplyAPY}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>LAR Rewards (est.)</span>
            <span className="font-semibold text-primary-600">
              {amount ? (parseFloat(amount) * 0.05).toFixed(2) : '0.00'} LAR
            </span>
          </div>
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
          onClick={handleSupply}
          disabled={
            !amount ||
            parseFloat(amount) <= 0 ||
            parseFloat(amount) > parseFloat(asset.walletBalance) ||
            status.status !== 'idle'
          }
          className="w-full px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          {status.status === 'idle' ? 'Supply' : status.status === 'success' ? '✓ Success' : 'Processing...'}
        </button>
      </div>
    </div>
  );
}
