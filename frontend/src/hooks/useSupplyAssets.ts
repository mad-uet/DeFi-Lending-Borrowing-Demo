'use client';

import useSWR from 'swr';
import { useWeb3 } from './useWeb3';
import { useContract } from './useContract';
import { SupplyAsset } from '@/types';
import { TOKEN_CONFIGS } from '@/lib/contracts';
import { formatUnits } from 'ethers';
import { bpsToPercent } from '@/lib/utils';

export function useSupplyAssets() {
  const { account, isConnected } = useWeb3();
  const lendingPool = useContract('LendingPool');

  const { data, error, isLoading, mutate } = useSWR(
    isConnected && lendingPool ? ['supplyAssets', account] : null,
    async () => {
      const assets: SupplyAsset[] = [];

      for (const tokenConfig of Object.values(TOKEN_CONFIGS)) {
        try {
          // Get token contract
          const tokenContract = useContract('ERC20', tokenConfig.address);
          if (!tokenContract || !lendingPool) continue;

          // Get wallet balance
          const walletBalance = account
            ? await tokenContract.balanceOf(account)
            : BigInt(0);

          // Get total supplied to pool
          const totalSupplied = await lendingPool.getTokenBalance(tokenConfig.address);

          // Get supply APY
          const supplyRate = await lendingPool.getSupplyRate(tokenConfig.address);
          const supplyAPY = bpsToPercent(supplyRate);

          // For simplicity, using mock USD prices (in production, use PriceOracle)
          const mockPrices: Record<string, number> = {
            WETH: 2000,
            DAI: 1,
            USDC: 1,
            LINK: 15,
          };

          const price = mockPrices[tokenConfig.symbol] || 0;
          const totalSuppliedFloat = parseFloat(formatUnits(totalSupplied, tokenConfig.decimals));
          const walletBalanceFloat = parseFloat(formatUnits(walletBalance, tokenConfig.decimals));

          assets.push({
            address: tokenConfig.address,
            symbol: tokenConfig.symbol,
            name: tokenConfig.name,
            decimals: tokenConfig.decimals,
            supplyAPY: supplyAPY.toString(),
            totalSupplied: formatUnits(totalSupplied, tokenConfig.decimals),
            totalSuppliedUSD: (totalSuppliedFloat * price).toString(),
            walletBalance: formatUnits(walletBalance, tokenConfig.decimals),
            walletBalanceUSD: (walletBalanceFloat * price).toString(),
            canBeCollateral: true,
          });
        } catch (err) {
          console.error(`Error fetching data for ${tokenConfig.symbol}:`, err);
        }
      }

      return assets;
    },
    {
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    assets: data || [],
    isLoading,
    error,
    mutate,
  };
}

// Helper hook to create contract instance
function useContract(contractName: 'ERC20', address: string) {
  const { provider } = useWeb3();
  if (!provider || !address) return null;
  
  const Contract = require('ethers').Contract;
  const ERC20_ABI = require('@/lib/contracts').ERC20_ABI;
  
  return new Contract(address, ERC20_ABI, provider);
}
