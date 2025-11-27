'use client';

import useSWR from 'swr';
import { useWeb3 } from './useWeb3';
import { useContract } from './useContract';
import { BorrowAsset } from '@/types';
import { TOKEN_CONFIGS, CHAIN_ID } from '@/lib/contracts';
import { formatUnits } from 'ethers';
import { bpsToPercent } from '@/lib/utils';

export function useBorrowAssets() {
  const { account, isConnected, chainId } = useWeb3();
  const lendingPool = useContract('LendingPool');
  const priceOracle = useContract('PriceOracle');

  const { data, error, isLoading, mutate } = useSWR(
    isConnected && lendingPool && priceOracle && chainId === CHAIN_ID ? ['borrowAssets', account] : null,
    async () => {
      const assets: BorrowAsset[] = [];

      // First, calculate total collateral and total borrows in USD
      let totalCollateralUSD = 0;
      let totalBorrowsUSD = 0;
      let weightedLTV = 0;

      for (const tokenConfig of Object.values(TOKEN_CONFIGS)) {
        try {
          if (!lendingPool || !priceOracle || !account) continue;

          const deposit = await lendingPool.getUserDeposit(account, tokenConfig.address);
          const borrow = await lendingPool.getUserBorrow(account, tokenConfig.address);
          const price = await priceOracle.getPrice(tokenConfig.address);
          
          const priceFloat = parseFloat(formatUnits(price, 18));
          const depositFloat = parseFloat(formatUnits(deposit, tokenConfig.decimals));
          const borrowFloat = parseFloat(formatUnits(borrow, tokenConfig.decimals));

          const depositUSD = depositFloat * priceFloat;
          const borrowUSD = borrowFloat * priceFloat;

          totalCollateralUSD += depositUSD;
          totalBorrowsUSD += borrowUSD;

          if (depositUSD > 0) {
            weightedLTV += depositUSD * tokenConfig.collateralFactor;
          }
        } catch (err) {
          console.error(`Error calculating totals for ${tokenConfig.symbol}:`, err);
        }
      }

      // Calculate available borrow capacity
      const effectiveLTV = totalCollateralUSD > 0 ? weightedLTV / totalCollateralUSD : 0;
      const maxBorrowCapacityUSD = totalCollateralUSD * effectiveLTV;
      const availableBorrowCapacityUSD = Math.max(0, maxBorrowCapacityUSD - totalBorrowsUSD);

      // Now build the assets list
      for (const tokenConfig of Object.values(TOKEN_CONFIGS)) {
        try {
          if (!lendingPool || !priceOracle) continue;

          // Get available to borrow (total supplied to pool)
          const available = await lendingPool.getTokenBalance(tokenConfig.address);

          // Get user's current borrow for this token
          const userBorrow = account
            ? await lendingPool.getUserBorrow(account, tokenConfig.address)
            : BigInt(0);

          // Get borrow APY
          const borrowRate = await lendingPool.getBorrowRate(tokenConfig.address);
          const borrowAPY = bpsToPercent(borrowRate);

          // Get price from oracle
          const price = await priceOracle.getPrice(tokenConfig.address);
          const priceFloat = parseFloat(formatUnits(price, 18));

          const availableFloat = parseFloat(formatUnits(available, tokenConfig.decimals));
          const userBorrowFloat = parseFloat(formatUnits(userBorrow, tokenConfig.decimals));

          // Calculate max borrow for this token (limited by both capacity and liquidity)
          const maxBorrowByCapacityTokens = availableBorrowCapacityUSD / priceFloat;
          const maxBorrowByLiquidity = availableFloat;
          const maxBorrowAmount = Math.min(maxBorrowByCapacityTokens, maxBorrowByLiquidity);
          const maxBorrowUSD = maxBorrowAmount * priceFloat;

          assets.push({
            address: tokenConfig.address,
            symbol: tokenConfig.symbol,
            name: tokenConfig.name,
            decimals: tokenConfig.decimals,
            borrowAPY: borrowAPY.toString(),
            availableToBorrow: formatUnits(available, tokenConfig.decimals),
            availableToBorrowUSD: (availableFloat * priceFloat).toString(),
            totalBorrowed: '0',
            totalBorrowedUSD: '0',
            yourBorrows: formatUnits(userBorrow, tokenConfig.decimals),
            yourBorrowsUSD: (userBorrowFloat * priceFloat).toString(),
            maxBorrow: maxBorrowAmount.toFixed(tokenConfig.decimals),
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
