'use client';

import { useState } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import { useContract } from '@/hooks/useContract';
import { TOKEN_CONFIGS } from '@/lib/contracts';
import { parseUnits } from 'ethers';
import toast from 'react-hot-toast';

export default function Faucet() {
  const { account, isConnected, signer } = useWeb3();
  const [loading, setLoading] = useState<string | null>(null);

  const mintTokens = async (symbol: string) => {
    if (!account || !signer) {
      toast.error('Please connect your wallet first');
      return;
    }

    const token = TOKEN_CONFIGS[symbol];
    if (!token) {
      toast.error('Token not found');
      return;
    }

    setLoading(symbol);

    try {
      // Get ERC20 contract with mint function
      const { Contract } = await import('ethers');
      const { ERC20_ABI } = await import('@/lib/contracts');
      const tokenContract = new Contract(token.address, ERC20_ABI, signer);

      // Mint 1000 tokens
      const amount = parseUnits('1000', token.decimals);
      const tx = await tokenContract.mint(account, amount);

      toast.loading(`Minting ${symbol}...`, { id: 'mint' });
      await tx.wait();

      toast.success(`Successfully minted 1000 ${symbol}!`, { id: 'mint' });
    } catch (error: any) {
      console.error('Mint error:', error);
      toast.error(error.message || `Failed to mint ${symbol}`, { id: 'mint' });
    } finally {
      setLoading(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl shadow-lg p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">🚰 Token Faucet</h2>
        <p className="text-gray-500">Connect wallet to get test tokens</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl shadow-lg p-6 mt-6">
      <h2 className="text-xl font-bold mb-4">🚰 Token Faucet</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Get free test tokens to try out the lending protocol
      </p>

      <div className="grid grid-cols-2 gap-3">
        {Object.keys(TOKEN_CONFIGS).map((symbol) => (
          <button
            key={symbol}
            onClick={() => mintTokens(symbol)}
            disabled={loading !== null}
            className={`
              px-4 py-3 rounded-lg font-semibold transition-all
              ${loading === symbol
                ? 'bg-gray-400 cursor-wait'
                : 'bg-primary-500 hover:bg-primary-600 transform hover:scale-105'
              }
              ${loading !== null && loading !== symbol ? 'opacity-50 cursor-not-allowed' : ''}
              text-white shadow-md
            `}
          >
            {loading === symbol ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Minting...</span>
              </div>
            ) : (
              `Get 1000 ${symbol}`
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          💡 Tip: You can mint tokens multiple times. These are test tokens for development purposes only.
        </p>
      </div>
    </div>
  );
}
