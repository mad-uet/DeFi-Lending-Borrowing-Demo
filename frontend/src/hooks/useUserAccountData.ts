'use client';

import useSWR from 'swr';
import { useWeb3 } from './useWeb3';
import { useContract } from './useContract';
import { TOKEN_CONFIGS, CHAIN_ID } from '@/lib/contracts';
import { formatUnits } from 'ethers';

interface UserAccountData {
  totalCollateralUSD: number;
  totalBorrowsUSD: number;
  availableBorrowsUSD: number;
  healthFactor: number;
  ltv: number;
}

export function useUserAccountData() {
  const { account, isConnected, chainId } = useWeb3();
  const lendingPool = useContract('LendingPool');
  const priceOracle = useContract('PriceOracle');

  const { data, error, isLoading, mutate } = useSWR(
    isConnected && account && lendingPool && priceOracle && chainId === CHAIN_ID 
      ? ['userAccountData', account] 
      : null,
    async () => {
      let totalCollateralUSD = 0;
      let totalBorrowsUSD = 0;
      let weightedLTV = 0;

      for (const tokenConfig of Object.values(TOKEN_CONFIGS)) {
        try {
          if (!lendingPool || !priceOracle) continue;

          // Get user deposit and borrow
          const deposit = await lendingPool.getUserDeposit(account, tokenConfig.address);
          const borrow = await lendingPool.getUserBorrow(account, tokenConfig.address);

          // Get price from oracle (18 decimals)
          const price = await priceOracle.getPrice(tokenConfig.address);
          const priceFloat = parseFloat(formatUnits(price, 18));

          // Calculate USD values
          const depositFloat = parseFloat(formatUnits(deposit, tokenConfig.decimals));
          const borrowFloat = parseFloat(formatUnits(borrow, tokenConfig.decimals));

          const depositUSD = depositFloat * priceFloat;
          const borrowUSD = borrowFloat * priceFloat;

          totalCollateralUSD += depositUSD;
          totalBorrowsUSD += borrowUSD;

          // Weight the LTV by collateral amount
          if (depositUSD > 0) {
            weightedLTV += depositUSD * tokenConfig.collateralFactor;
          }
        } catch (err) {
          console.error(`Error fetching account data for ${tokenConfig.symbol}:`, err);
        }
      }

      // Calculate effective LTV
      const effectiveLTV = totalCollateralUSD > 0 ? weightedLTV / totalCollateralUSD : 0;

      // Calculate available borrows (collateral * LTV - current borrows)
      const maxBorrowCapacity = totalCollateralUSD * effectiveLTV;
      const availableBorrowsUSD = Math.max(0, maxBorrowCapacity - totalBorrowsUSD);

      // Calculate health factor
      // Health Factor = (Collateral * LTV) / Borrows
      let healthFactor = Infinity;
      if (totalBorrowsUSD > 0) {
        healthFactor = maxBorrowCapacity / totalBorrowsUSD;
      }

      return {
        totalCollateralUSD,
        totalBorrowsUSD,
        availableBorrowsUSD,
        healthFactor,
        ltv: effectiveLTV,
      } as UserAccountData;
    },
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  return {
    accountData: data || {
      totalCollateralUSD: 0,
      totalBorrowsUSD: 0,
      availableBorrowsUSD: 0,
      healthFactor: Infinity,
      ltv: 0,
    },
    isLoading,
    error,
    mutate,
  };
}
