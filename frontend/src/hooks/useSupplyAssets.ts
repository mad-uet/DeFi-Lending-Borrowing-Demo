'use client';

import useSWR from 'swr';
import { useWeb3 } from './useWeb3';
import { useContract } from './useContract';
import { SupplyAsset } from '@/types';
import { TOKEN_CONFIGS, CHAIN_ID } from '@/lib/contracts';
import { formatUnits, Contract } from 'ethers';
import { bpsToPercent } from '@/lib/utils';

export function useSupplyAssets() {
  const { account, isConnected, provider, chainId } = useWeb3();
  const lendingPool = useContract('LendingPool');

  const { data, error, isLoading, mutate } = useSWR(
    isConnected && lendingPool && chainId === CHAIN_ID ? ['supplyAssets', account] : null,
    async () => {
      const assets: SupplyAsset[] = [];

      for (const tokenConfig of Object.values(TOKEN_CONFIGS)) {
        try {
          if (!tokenConfig.address) continue;
          if (!provider || !lendingPool) continue;

          // 1. Defensive Check: Is the token active?
          // If this call fails, the LendingPool address is likely wrong or the Proxy is uninitialized.
          let isActive = false;
          try {
            const poolConfig = await lendingPool.tokenConfigs(tokenConfig.address);
            isActive = poolConfig.isActive;
          } catch (configError) {
            console.warn(`Failed to fetch config for ${tokenConfig.symbol}. Check LendingPool address.`, configError);
            continue; // Skip this token
          }

          if (!isActive) continue;

          // 2. Get token contract
          const tokenContract = new Contract(tokenConfig.address, ['function balanceOf(address) view returns (uint256)'], provider);

          // 3. Get wallet balance
          const walletBalance = account
            ? await tokenContract.balanceOf(account)
            : BigInt(0);

          // 4. Get total supplied to pool
          const totalSupplied = await lendingPool.getTokenBalance(tokenConfig.address);

          // 5. Get supply APY
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
