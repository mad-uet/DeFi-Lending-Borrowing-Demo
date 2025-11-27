'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import { useContract } from '@/hooks/useContract';
import { formatUnits } from 'ethers';
import Link from 'next/link';
import { ADDRESSES, CHAIN_ID } from '@/lib/contracts';

interface TokenStats {
  token: string;
  symbol: string;
  totalDeposits: string;
  totalBorrows: string;
  utilizationRate: number;
  supplyAPY: number;
  borrowAPY: number;
  price: string;
  tvlUSD: number;
  borrowedUSD: number;
}

interface ProtocolStats {
  totalValueLockedUSD: number;
  totalBorrowedUSD: number;
  totalSuppliedUSD: number;
  overallUtilizationRate: number;
  larTokensInCirculation: string;
}

export default function AnalyticsPage() {
  const { isConnected, chainId } = useWeb3();
  const lendingPool = useContract('LendingPool');
  const priceOracle = useContract('PriceOracle');
  const larToken = useContract('LARToken');
  
  const [protocolStats, setProtocolStats] = useState<ProtocolStats | null>(null);
  const [tokenStats, setTokenStats] = useState<TokenStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supportedTokens = [
    { address: ADDRESSES.WETH, symbol: 'WETH', decimals: 18 },
    { address: ADDRESSES.DAI, symbol: 'DAI', decimals: 18 },
    { address: ADDRESSES.USDC, symbol: 'USDC', decimals: 6 },
    { address: ADDRESSES.LINK, symbol: 'LINK', decimals: 18 },
  ];

  const fetchAnalytics = useCallback(async () => {
    if (!lendingPool || !priceOracle || !larToken) return;

    try {
      setError(null);
      setLoading(true);

      let totalTVL = 0;
      let totalBorrowed = 0;
      const tokenStatsArray: TokenStats[] = [];

      for (const token of supportedTokens) {
        if (!token.address) continue;

        try {
          const config = await lendingPool.tokenConfigs(token.address);
          if (!config.isActive) continue;

          const [totalDeposits, totalBorrows, price, borrowRate, supplyRate] = await Promise.all([
            lendingPool.totalDeposits(token.address),
            lendingPool.totalBorrows(token.address),
            priceOracle.getPrice(token.address),
            lendingPool.getBorrowRate(token.address),
            lendingPool.getSupplyRate(token.address),
          ]);

          const depositsFormatted = formatUnits(totalDeposits, token.decimals);
          const borrowsFormatted = formatUnits(totalBorrows, token.decimals);
          const priceFormatted = formatUnits(price, 18);

          const tvlUSD = parseFloat(depositsFormatted) * parseFloat(priceFormatted);
          const borrowedUSD = parseFloat(borrowsFormatted) * parseFloat(priceFormatted);

          totalTVL += tvlUSD;
          totalBorrowed += borrowedUSD;

          const utilizationRate = totalDeposits > 0n 
            ? Number((totalBorrows * 10000n) / totalDeposits) / 100
            : 0;

          const borrowAPY = Number(borrowRate) / 100;
          const supplyAPY = Number(supplyRate) / 100;

          tokenStatsArray.push({
            token: token.address,
            symbol: token.symbol,
            totalDeposits: depositsFormatted,
            totalBorrows: borrowsFormatted,
            utilizationRate,
            supplyAPY,
            borrowAPY,
            price: priceFormatted,
            tvlUSD,
            borrowedUSD,
          });
        } catch (tokenErr) {
          console.warn(`Error fetching data for ${token.symbol}:`, tokenErr);
        }
      }

      let larSupplyFormatted = '0';
      try {
        const larSupply = await larToken.totalSupply();
        larSupplyFormatted = formatUnits(larSupply, 18);
      } catch (e) {
        console.warn('Error fetching LAR supply:', e);
      }

      const overallUtilization = totalTVL > 0 ? (totalBorrowed / totalTVL) * 100 : 0;

      setProtocolStats({
        totalValueLockedUSD: totalTVL,
        totalBorrowedUSD: totalBorrowed,
        totalSuppliedUSD: totalTVL,
        overallUtilizationRate: overallUtilization,
        larTokensInCirculation: larSupplyFormatted,
      });

      setTokenStats(tokenStatsArray);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [lendingPool, priceOracle, larToken]);

  useEffect(() => {
    const isReady = isConnected && chainId === CHAIN_ID && lendingPool && priceOracle && larToken;
    
    if (isReady) {
      fetchAnalytics();
      const interval = setInterval(fetchAnalytics, 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected, chainId, lendingPool, priceOracle, larToken, fetchAnalytics]);

  const formatCurrency = (value: number) => {
    if (isNaN(value) || !isFinite(value)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || !isFinite(num)) return '0.00';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <header className="bg-white dark:bg-gray-800 shadow-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  DL
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Protocol Analytics
                </h1>
              </Link>
              <Link href="/" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Please connect your wallet to view protocol analytics</p>
            <Link href="/" className="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (chainId !== CHAIN_ID) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <header className="bg-white dark:bg-gray-800 shadow-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  DL
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Protocol Analytics</h1>
              </Link>
              <Link href="/" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Wrong Network</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Please switch to Hardhat Local network (Chain ID: {CHAIN_ID})</p>
            <Link href="/" className="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                DL
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Protocol Analytics</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Real-time protocol statistics</p>
              </div>
            </Link>
            <Link href="/" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">Error: {error}</p>
          </div>
        )}

        {loading && !protocolStats ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            {protocolStats && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Protocol Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Value Locked</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(protocolStats.totalValueLockedUSD)}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Borrowed</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(protocolStats.totalBorrowedUSD)}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Overall Utilization</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{protocolStats.overallUtilizationRate.toFixed(2)}%</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">LAR Tokens in Circulation</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(protocolStats.larTokensInCirculation)}</div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Token Markets</h2>
              {tokenStats.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No active token markets found.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Asset</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Supplied</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Borrowed</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Supply APY</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Borrow APY</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Utilization</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">TVL (USD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {tokenStats.map((stat) => (
                          <tr key={stat.token} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                                  {stat.symbol.slice(0, 2)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{stat.symbol}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">${parseFloat(stat.price).toFixed(2)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">{formatNumber(stat.totalDeposits)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">{formatNumber(stat.totalBorrows)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <span className="text-green-600 dark:text-green-400 font-medium">{stat.supplyAPY.toFixed(2)}%</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <span className="text-orange-600 dark:text-orange-400 font-medium">{stat.borrowAPY.toFixed(2)}%</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${Math.min(stat.utilizationRate, 100)}%` }}></div>
                                </div>
                                <span>{stat.utilizationRate.toFixed(1)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(stat.tvlUSD)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Analytics Update:</strong> Data refreshes every 10 seconds. LAR tokens are minted 1:1 with USD value of deposits.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
