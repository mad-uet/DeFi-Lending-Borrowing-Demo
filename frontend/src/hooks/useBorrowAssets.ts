'use client';

import useSWR from 'swr';
import { useWeb3 } from './useWeb3';
import { useContract } from './useContract';
import { BorrowAsset } from '@/types';
import { TOKEN_CONFIGS } from '@/lib/contracts';
import { formatUnits } from 'ethers';
import { bpsToPercent, calculateMaxBorrow } from '@/lib/utils';

export function useBorrowAssets() {
  const { account, isConnected } = useWeb3();
  const lendingPool = useContract('LendingPool');

  const { data, error, isLoading, mutate } = useSWR(
    isConnected && lendingPool ? ['borrowAssets', account] : null,
    async () => {
      const assets: BorrowAsset[] = [];

      for (const tokenConfig of Object.values(TOKEN_CONFIGS)) {
        try {
          if (!lendingPool) continue;

          // Get available to borrow (total supplied)
          const available = await lendingPool.getTokenBalance(tokenConfig.address);

          // Get user's borrow
          const userBorrow = account
            ? await lendingPool.getUserBorrow(account, tokenConfig.address)
            : BigInt(0);

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
          const availableFloat = parseFloat(formatUnits(available, tokenConfig.decimals));
          const userBorrowFloat = parseFloat(formatUnits(userBorrow, tokenConfig.decimals));

          // Calculate max borrow (simplified - in production use health factor)
          const totalCollateralUSD = 10000; // Mock value
          const currentBorrowUSD = userBorrowFloat * price;
          const maxBorrowUSD = calculateMaxBorrow(
            totalCollateralUSD,
            currentBorrowUSD,
            tokenConfig.collateralFactor
          );
          const maxBorrowAmount = maxBorrowUSD / price;

          assets.push({
            address: tokenConfig.address,
            symbol: tokenConfig.symbol,
            name: tokenConfig.name,
            decimals: tokenConfig.decimals,
            borrowAPY: borrowAPY.toString(),
            availableToBorrow: formatUnits(available, tokenConfig.decimals),
            availableToBorrowUSD: (availableFloat * price).toString(),
            totalBorrowed: '0', // Would need to sum all users' borrows
            totalBorrowedUSD: '0',
            yourBorrows: formatUnits(userBorrow, tokenConfig.decimals),
            yourBorrowsUSD: (userBorrowFloat * price).toString(),
            maxBorrow: maxBorrowAmount.toString(),
            maxBorrowUSD: maxBorrowUSD.toString(),
          });
        } catch (err) {
          console.error(`Error fetching borrow data for ${tokenConfig.symbol}:`, err);
        }
      }

      return assets;
    },
    {
      refreshInterval: 5000,
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
