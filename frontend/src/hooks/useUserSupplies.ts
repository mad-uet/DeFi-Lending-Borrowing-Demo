'use client';

import useSWR from 'swr';
import { useWeb3 } from './useWeb3';
import { useContract } from './useContract';
import { UserSupply } from '@/types';
import { TOKEN_CONFIGS, CHAIN_ID } from '@/lib/contracts';
import { formatUnits } from 'ethers';
import { bpsToPercent } from '@/lib/utils';

export function useUserSupplies() {
  const { account, isConnected, chainId } = useWeb3();
  const lendingPool = useContract('LendingPool');

  const { data, error, isLoading, mutate } = useSWR(
    isConnected && account && lendingPool && chainId === CHAIN_ID ? ['userSupplies', account] : null,
    async () => {
      const supplies: UserSupply[] = [];

      for (const tokenConfig of Object.values(TOKEN_CONFIGS)) {
        try {
          if (!tokenConfig.address) continue;
          if (!lendingPool) continue;

          // 1. Defensive Check: Is the token active?
          let isActive = false;
          try {
            const poolConfig = await lendingPool.tokenConfigs(tokenConfig.address);
            isActive = poolConfig.isActive;
          } catch (configError) {
            // Silently fail for user supplies if config check fails
            continue;
          }

          if (!isActive) continue;

          // 2. Get user deposit
          const deposit = await lendingPool.getUserDeposit(account, tokenConfig.address);
          
          if (deposit === BigInt(0)) continue; // Skip if no deposit

          // 3. Get supply APY
          const supplyRate = await lendingPool.getSupplyRate(tokenConfig.address);
          const supplyAPY = bpsToPercent(supplyRate);

          // Mock USD prices
          const mockPrices: Record<string, number> = {
            WETH: 2000,
            DAI: 1,
            USDC: 1,
            LINK: 15,
          };

          const price = mockPrices[tokenConfig.symbol] || 0;
          const depositFloat = parseFloat(formatUnits(deposit, tokenConfig.decimals));

          // Mock LAR earned (in production, fetch from contract)
          const larEarned = (depositFloat * supplyAPY * 0.01).toString(); // Simplified calculation

          supplies.push({
            asset: {
              address: tokenConfig.address,
              symbol: tokenConfig.symbol,
              name: tokenConfig.name,
              decimals: tokenConfig.decimals,
            },
            supplied: formatUnits(deposit, tokenConfig.decimals),
            suppliedUSD: (depositFloat * price).toString(),
            larEarned,
            apy: supplyAPY.toString(),
            isCollateral: true,
          });
        } catch (err) {
          console.error(`Error fetching user supply for ${tokenConfig.symbol}:`, err);
        }
      }

      return supplies;
    },
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  return {
    supplies: data || [],
    isLoading,
    error,
    mutate,
  };
}
