'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { ethers, Contract } from 'ethers';
import { useWeb3 } from './useWeb3';
import { useContract } from './useContract';
import { 
  LiquidationEvent, 
  LiquidatablePosition, 
  LiquidatorStats, 
  SimulatedLiquidator 
} from '@/types';
import { 
  LIQUIDATION_CONFIG, 
  SIMULATED_LIQUIDATOR, 
  TOKEN_CONFIGS,
  ADDRESSES,
  LENDING_POOL_ABI
} from '@/lib/contracts';
import { useTransactionNotifications } from './useNotifications';

interface LiquidatorBotState {
  // Bot configuration
  liquidator: SimulatedLiquidator;
  isActive: boolean;
  autoLiquidate: boolean;
  liquidationDelay: number;
  
  // Positions monitoring
  liquidatablePositions: LiquidatablePosition[];
  atRiskPositions: LiquidatablePosition[]; // HF between 1.0 and 1.2
  
  // Liquidation tracking
  pendingLiquidation: {
    position: LiquidatablePosition;
    countdown: number;
  } | null;
  
  // Statistics
  stats: LiquidatorStats;
  
  // Recent activity
  recentLiquidations: LiquidationEvent[];
}

interface LiquidatorBotContextType extends LiquidatorBotState {
  // Actions
  startBot: () => void;
  stopBot: () => void;
  toggleAutoLiquidate: () => void;
  setLiquidationDelay: (ms: number) => void;
  
  // Manual liquidation
  executeLiquidation: (
    borrower: string,
    debtToken: string,
    debtAmount: string,
    collateralToken: string
  ) => Promise<boolean>;
  
  // Calculations
  calculateLiquidationProfit: (
    debtAmountUSD: number,
    liquidationBonus?: number
  ) => number;
  
  // Refresh
  refreshPositions: () => Promise<void>;
}

const LiquidatorBotContext = createContext<LiquidatorBotContextType | null>(null);

// Generate a pseudo-random address for the simulated liquidator
function generateLiquidatorAddress(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function LiquidatorBotProvider({ children }: { children: ReactNode }) {
  const { provider, isConnected, account } = useWeb3();
  const lendingPool = useContract('LendingPool');
  const { notifyTransactionSuccess, notifyTransactionError, notifyLiquidationEvent } = useTransactionNotifications();
  
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [state, setState] = useState<LiquidatorBotState>({
    liquidator: {
      address: generateLiquidatorAddress(),
      name: SIMULATED_LIQUIDATOR.name,
      balance: { ...SIMULATED_LIQUIDATOR.initialBalance },
      isActive: false,
      autoLiquidate: false,
      liquidationDelay: LIQUIDATION_CONFIG.DEFAULT_LIQUIDATION_DELAY_MS,
    },
    isActive: false,
    autoLiquidate: false,
    liquidationDelay: LIQUIDATION_CONFIG.DEFAULT_LIQUIDATION_DELAY_MS,
    liquidatablePositions: [],
    atRiskPositions: [],
    pendingLiquidation: null,
    stats: {
      totalLiquidations: 0,
      totalDebtRepaid: '0',
      totalCollateralSeized: '0',
      totalProfitUSD: '0',
      liquidationHistory: [],
    },
    recentLiquidations: [],
  });

  // Calculate potential profit from liquidation
  const calculateLiquidationProfit = useCallback((
    debtAmountUSD: number,
    liquidationBonus: number = LIQUIDATION_CONFIG.LIQUIDATION_BONUS
  ): number => {
    return debtAmountUSD * liquidationBonus;
  }, []);

  // Scan for liquidatable positions
  const scanForLiquidatablePositions = useCallback(async (): Promise<{
    liquidatable: LiquidatablePosition[];
    atRisk: LiquidatablePosition[];
  }> => {
    if (!lendingPool || !provider) {
      return { liquidatable: [], atRisk: [] };
    }

    const liquidatable: LiquidatablePosition[] = [];
    const atRisk: LiquidatablePosition[] = [];

    try {
      // Get all addresses that have interacted with the pool
      // In a real scenario, this would come from indexing events
      // For simulation, we'll check the current user's account
      const addressesToCheck = [account].filter(Boolean);

      for (const address of addressesToCheck) {
        if (!address) continue;

        try {
          const [totalCollateralUSD, totalDebtUSD, , healthFactor] = 
            await lendingPool.getUserAccountData(address);

          const hfNumber = Number(ethers.formatEther(healthFactor));
          const debtUSD = Number(ethers.formatEther(totalDebtUSD));
          const collateralUSD = Number(ethers.formatEther(totalCollateralUSD));

          // Skip if no debt
          if (debtUSD === 0) continue;

          // Gather debt and collateral details
          const debts: LiquidatablePosition['debts'] = [];
          const collaterals: LiquidatablePosition['collaterals'] = [];

          for (const [symbol, config] of Object.entries(TOKEN_CONFIGS)) {
            const borrowed = await lendingPool.getUserBorrow(address, config.address);
            const deposited = await lendingPool.getUserDeposit(address, config.address);

            if (borrowed > 0n) {
              const amount = ethers.formatUnits(borrowed, config.decimals);
              // Simplified USD calculation - in production use oracle
              const priceUSD = symbol === 'WETH' ? 2000 : symbol === 'LINK' ? 15 : 1;
              debts.push({
                token: config.address,
                symbol,
                amount,
                amountUSD: (parseFloat(amount) * priceUSD).toFixed(2),
              });
            }

            if (deposited > 0n) {
              const amount = ethers.formatUnits(deposited, config.decimals);
              const priceUSD = symbol === 'WETH' ? 2000 : symbol === 'LINK' ? 15 : 1;
              collaterals.push({
                token: config.address,
                symbol,
                amount,
                amountUSD: (parseFloat(amount) * priceUSD).toFixed(2),
              });
            }
          }

          const position: LiquidatablePosition = {
            borrower: address,
            healthFactor: hfNumber,
            totalDebtUSD: debtUSD.toFixed(2),
            totalCollateralUSD: collateralUSD.toFixed(2),
            maxLiquidationUSD: (debtUSD * LIQUIDATION_CONFIG.MAX_CLOSE_FACTOR).toFixed(2),
            potentialProfit: calculateLiquidationProfit(
              debtUSD * LIQUIDATION_CONFIG.MAX_CLOSE_FACTOR
            ).toFixed(2),
            debts,
            collaterals,
          };

          if (hfNumber < LIQUIDATION_CONFIG.HEALTH_FACTOR_THRESHOLD) {
            liquidatable.push(position);
          } else if (hfNumber < 1.2) {
            atRisk.push(position);
          }
        } catch (err) {
          console.error(`Error checking position for ${address}:`, err);
        }
      }
    } catch (err) {
      console.error('Error scanning for liquidatable positions:', err);
    }

    return { liquidatable, atRisk };
  }, [lendingPool, provider, account, calculateLiquidationProfit]);

  // Refresh positions
  const refreshPositions = useCallback(async () => {
    const { liquidatable, atRisk } = await scanForLiquidatablePositions();
    setState(prev => ({
      ...prev,
      liquidatablePositions: liquidatable,
      atRiskPositions: atRisk,
    }));
  }, [scanForLiquidatablePositions]);

  // Execute liquidation
  const executeLiquidation = useCallback(async (
    borrower: string,
    debtToken: string,
    debtAmount: string,
    collateralToken: string
  ): Promise<boolean> => {
    if (!lendingPool || !provider) {
      notifyTransactionError('Liquidation', 'No connection to lending pool');
      return false;
    }

    try {
      // Get signer for the actual connected wallet (acting as liquidator)
      const signer = await provider.getSigner();
      
      // Create a new contract instance with signer for transactions
      const lendingPoolWithSigner = new Contract(ADDRESSES.LendingPool, LENDING_POOL_ABI, signer);

      // Get health factor before
      const [, , , hfBefore] = await lendingPool.getUserAccountData(borrower);

      // Execute liquidation
      const tx = await lendingPoolWithSigner.liquidate(
        borrower,
        debtToken,
        ethers.parseEther(debtAmount),
        collateralToken
      );

      const receipt = await tx.wait();

      // Get health factor after
      const [, , , hfAfter] = await lendingPool.getUserAccountData(borrower);

      // Find the debt and collateral symbols
      const debtSymbol = Object.entries(TOKEN_CONFIGS).find(
        ([, config]) => config.address.toLowerCase() === debtToken.toLowerCase()
      )?.[0] || 'Unknown';
      
      const collateralSymbol = Object.entries(TOKEN_CONFIGS).find(
        ([, config]) => config.address.toLowerCase() === collateralToken.toLowerCase()
      )?.[0] || 'Unknown';

      // Calculate collateral seized (debt * 1.05)
      const debtAmountNum = parseFloat(debtAmount);
      const collateralPriceUSD = collateralSymbol === 'WETH' ? 2000 : collateralSymbol === 'LINK' ? 15 : 1;
      const debtPriceUSD = debtSymbol === 'WETH' ? 2000 : debtSymbol === 'LINK' ? 15 : 1;
      const debtValueUSD = debtAmountNum * debtPriceUSD;
      const collateralSeizedUSD = debtValueUSD * (1 + LIQUIDATION_CONFIG.LIQUIDATION_BONUS);
      const collateralSeized = collateralSeizedUSD / collateralPriceUSD;
      const bonusUSD = debtValueUSD * LIQUIDATION_CONFIG.LIQUIDATION_BONUS;

      // Create liquidation event
      const liquidationEvent: LiquidationEvent = {
        id: `liq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        borrower,
        liquidator: account || state.liquidator.address,
        debtToken,
        debtTokenSymbol: debtSymbol,
        debtAmount,
        debtAmountUSD: debtValueUSD.toFixed(2),
        collateralToken,
        collateralTokenSymbol: collateralSymbol,
        collateralSeized: collateralSeized.toFixed(6),
        collateralSeizedUSD: collateralSeizedUSD.toFixed(2),
        liquidationBonus: (collateralSeized * LIQUIDATION_CONFIG.LIQUIDATION_BONUS / (1 + LIQUIDATION_CONFIG.LIQUIDATION_BONUS)).toFixed(6),
        liquidationBonusUSD: bonusUSD.toFixed(2),
        timestamp: Date.now(),
        transactionHash: receipt.hash,
        healthFactorBefore: ethers.formatEther(hfBefore),
        healthFactorAfter: ethers.formatEther(hfAfter),
      };

      // Update state
      setState(prev => ({
        ...prev,
        pendingLiquidation: null,
        stats: {
          ...prev.stats,
          totalLiquidations: prev.stats.totalLiquidations + 1,
          totalDebtRepaid: (parseFloat(prev.stats.totalDebtRepaid) + debtValueUSD).toFixed(2),
          totalCollateralSeized: (parseFloat(prev.stats.totalCollateralSeized) + collateralSeizedUSD).toFixed(2),
          totalProfitUSD: (parseFloat(prev.stats.totalProfitUSD) + bonusUSD).toFixed(2),
          liquidationHistory: [liquidationEvent, ...prev.stats.liquidationHistory],
        },
        recentLiquidations: [liquidationEvent, ...prev.recentLiquidations.slice(0, 9)],
      }));

      notifyLiquidationEvent(
        debtSymbol,
        `${debtAmount} repaid → ${collateralSeized.toFixed(4)} ${collateralSymbol} received (+${(LIQUIDATION_CONFIG.LIQUIDATION_BONUS * 100).toFixed(0)}% bonus: $${bonusUSD.toFixed(2)} profit)`
      );

      // Refresh positions
      await refreshPositions();

      return true;
    } catch (err: any) {
      console.error('Liquidation failed:', err);
      notifyTransactionError('Liquidation', err.message || 'Unknown error');
      setState(prev => ({ ...prev, pendingLiquidation: null }));
      return false;
    }
  }, [lendingPool, provider, account, state.liquidator.address, notifyTransactionError, notifyLiquidationEvent, refreshPositions]);

  // Start auto-liquidation countdown
  const startLiquidationCountdown = useCallback((position: LiquidatablePosition) => {
    if (!state.autoLiquidate) return;

    // Clear any existing countdown
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    const totalTime = state.liquidationDelay;
    let remaining = totalTime;

    setState(prev => ({
      ...prev,
      pendingLiquidation: { position, countdown: remaining },
    }));

    countdownRef.current = setInterval(() => {
      remaining -= 100;
      
      if (remaining <= 0) {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
        
        // Execute liquidation
        if (position.debts.length > 0 && position.collaterals.length > 0) {
          const debt = position.debts[0];
          const collateral = position.collaterals[0];
          
          // Calculate max liquidation amount (50% of debt)
          const maxDebt = parseFloat(debt.amount) * LIQUIDATION_CONFIG.MAX_CLOSE_FACTOR;
          
          executeLiquidation(
            position.borrower,
            debt.token,
            maxDebt.toString(),
            collateral.token
          );
        }
      } else {
        setState(prev => ({
          ...prev,
          pendingLiquidation: prev.pendingLiquidation 
            ? { ...prev.pendingLiquidation, countdown: remaining }
            : null,
        }));
      }
    }, 100);
  }, [state.autoLiquidate, state.liquidationDelay, executeLiquidation]);

  // Cancel pending liquidation
  const cancelPendingLiquidation = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    setState(prev => ({ ...prev, pendingLiquidation: null }));
  }, []);

  // Start bot
  const startBot = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: true,
      liquidator: { ...prev.liquidator, isActive: true },
    }));

    // Start scanning for positions
    scanIntervalRef.current = setInterval(async () => {
      const { liquidatable, atRisk } = await scanForLiquidatablePositions();
      
      setState(prev => {
        // If auto-liquidate is on and there are liquidatable positions, start countdown
        if (prev.autoLiquidate && liquidatable.length > 0 && !prev.pendingLiquidation) {
          startLiquidationCountdown(liquidatable[0]);
        }
        
        return {
          ...prev,
          liquidatablePositions: liquidatable,
          atRiskPositions: atRisk,
        };
      });
    }, 5000); // Scan every 5 seconds

    // Initial scan
    refreshPositions();
  }, [scanForLiquidatablePositions, startLiquidationCountdown, refreshPositions]);

  // Stop bot
  const stopBot = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    cancelPendingLiquidation();
    
    setState(prev => ({
      ...prev,
      isActive: false,
      liquidator: { ...prev.liquidator, isActive: false },
    }));
  }, [cancelPendingLiquidation]);

  // Toggle auto-liquidate
  const toggleAutoLiquidate = useCallback(() => {
    setState(prev => {
      const newAutoLiquidate = !prev.autoLiquidate;
      
      // If turning off, cancel any pending liquidation
      if (!newAutoLiquidate) {
        cancelPendingLiquidation();
      }
      
      return {
        ...prev,
        autoLiquidate: newAutoLiquidate,
        liquidator: { ...prev.liquidator, autoLiquidate: newAutoLiquidate },
      };
    });
  }, [cancelPendingLiquidation]);

  // Set liquidation delay
  const setLiquidationDelay = useCallback((ms: number) => {
    const clampedDelay = Math.max(
      LIQUIDATION_CONFIG.MIN_LIQUIDATION_DELAY_MS,
      Math.min(LIQUIDATION_CONFIG.MAX_LIQUIDATION_DELAY_MS, ms)
    );
    
    setState(prev => ({
      ...prev,
      liquidationDelay: clampedDelay,
      liquidator: { ...prev.liquidator, liquidationDelay: clampedDelay },
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Auto-start liquidation when positions become liquidatable
  useEffect(() => {
    if (
      state.isActive && 
      state.autoLiquidate && 
      state.liquidatablePositions.length > 0 && 
      !state.pendingLiquidation
    ) {
      startLiquidationCountdown(state.liquidatablePositions[0]);
    }
  }, [state.isActive, state.autoLiquidate, state.liquidatablePositions, state.pendingLiquidation, startLiquidationCountdown]);

  const value: LiquidatorBotContextType = {
    ...state,
    startBot,
    stopBot,
    toggleAutoLiquidate,
    setLiquidationDelay,
    executeLiquidation,
    calculateLiquidationProfit,
    refreshPositions,
  };

  return (
    <LiquidatorBotContext.Provider value={value}>
      {children}
    </LiquidatorBotContext.Provider>
  );
}

export function useLiquidatorBot() {
  const context = useContext(LiquidatorBotContext);
  if (!context) {
    throw new Error('useLiquidatorBot must be used within a LiquidatorBotProvider');
  }
  return context;
}

// Helper hook for checking if bot is available
export function useIsLiquidatorBotAvailable() {
  const context = useContext(LiquidatorBotContext);
  return context !== null;
}
