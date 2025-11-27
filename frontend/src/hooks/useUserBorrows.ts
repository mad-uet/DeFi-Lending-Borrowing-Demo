'use client';

import useSWR from 'swr';
import { useWeb3 } from './useWeb3';
import { useContract } from './useContract';
import { UserBorrow } from '@/types';
import { TOKEN_CONFIGS, CHAIN_ID } from '@/lib/contracts';
import { formatUnits } from 'ethers';
import { bpsToPercent } from '@/lib/utils';

export function useUserBorrows() {
  const { account, isConnected, chainId } = useWeb3();
  const lendingPool = useContract('LendingPool');

  const { data, error, isLoading, mutate } = useSWR(
    isConnected && account && lendingPool && chainId === CHAIN_ID ? ['userBorrows', account] : null,
    async () => {
      const borrows: UserBorrow[] = [];

      for (const tokenConfig of Object.values(TOKEN_CONFIGS)) {
        try {
          if (!lendingPool) continue;

          // Get user borrow
          const borrow = await lendingPool.getUserBorrow(account, tokenConfig.address);
          
          if (borrow === BigInt(0)) continue; // Skip if no borrow

          // Get borrow APY
          const borrowRate = await lendingPool.getBorrowRate(tokenConfig.address);
          const borrowAPY = bpsToPercent(borrowRate);

          // Mock USD prices
          const mockPrices: Record<string, number> = {
            WETH: 2000,
            DAI: 1,
            USDC: 1,
            LINK: 15,
          };

          const price = mockPrices[tokenConfig.symbol] || 0;
          const borrowFloat = parseFloat(formatUnits(borrow, tokenConfig.decimals));

          // Calculate accrued interest (simplified)
          const accruedInterest = borrowFloat * (borrowAPY / 100) * 0.1; // Mock 10% time passed
          const totalDebt = borrowFloat + accruedInterest;

          borrows.push({
            asset: {
              address: tokenConfig.address,
              symbol: tokenConfig.symbol,
              name: tokenConfig.name,
              decimals: tokenConfig.decimals,
            },
            borrowed: formatUnits(borrow, tokenConfig.decimals),
            borrowedUSD: (borrowFloat * price).toString(),
            accruedInterest: accruedInterest.toString(),
            totalDebt: totalDebt.toString(),
            totalDebtUSD: (totalDebt * price).toString(),
            apy: borrowAPY.toString(),
          });
        } catch (err) {
          console.error(`Error fetching user borrow for ${tokenConfig.symbol}:`, err);
        }
      }

      return borrows;
    },
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  return {
    borrows: data || [],
    isLoading,
    error,
    mutate,
  };
}
