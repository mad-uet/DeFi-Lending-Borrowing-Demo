'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { TOKEN_CONFIGS } from '@/lib/contracts';

interface SimulatedBalance {
  symbol: string;
  wallet: number;
  supplied: number;
  borrowed: number;
}

interface SimulationState {
  isActive: boolean;
  balances: Record<string, SimulatedBalance>;
  transactionHistory: SimulatedTransaction[];
}

interface SimulatedTransaction {
  id: string;
  type: 'supply' | 'withdraw' | 'borrow' | 'repay';
  symbol: string;
  amount: number;
  timestamp: number;
  healthFactorBefore: number;
  healthFactorAfter: number;
}

interface SimulationContextType {
  isSimulationMode: boolean;
  startSimulation: () => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
  simulatedBalances: Record<string, SimulatedBalance>;
  simulatedTransactions: SimulatedTransaction[];
  
  // Simulated actions
  simulateSupply: (symbol: string, amount: number) => boolean;
  simulateWithdraw: (symbol: string, amount: number) => boolean;
  simulateBorrow: (symbol: string, amount: number) => boolean;
  simulateRepay: (symbol: string, amount: number) => boolean;
  
  // Calculated values
  getSimulatedHealthFactor: () => number;
  getSimulatedTotalCollateral: () => number;
  getSimulatedTotalBorrows: () => number;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

// Mock prices for simulation
const MOCK_PRICES: Record<string, number> = {
  WETH: 2000,
  DAI: 1,
  USDC: 1,
  LINK: 15,
};

// Collateral factors (LTV)
const COLLATERAL_FACTORS: Record<string, number> = {
  WETH: 0.75,
  DAI: 0.8,
  USDC: 0.85,
  LINK: 0.7,
};

const getInitialBalances = (): Record<string, SimulatedBalance> => {
  const balances: Record<string, SimulatedBalance> = {};
  
  for (const [symbol, config] of Object.entries(TOKEN_CONFIGS)) {
    balances[symbol] = {
      symbol,
      wallet: symbol === 'WETH' ? 10 : symbol === 'DAI' ? 10000 : symbol === 'USDC' ? 10000 : 100,
      supplied: 0,
      borrowed: 0,
    };
  }
  
  return balances;
};

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SimulationState>({
    isActive: false,
    balances: getInitialBalances(),
    transactionHistory: [],
  });

  const getSimulatedTotalCollateral = useCallback(() => {
    let total = 0;
    for (const balance of Object.values(state.balances)) {
      const price = MOCK_PRICES[balance.symbol] || 0;
      total += balance.supplied * price;
    }
    return total;
  }, [state.balances]);

  const getSimulatedTotalBorrows = useCallback(() => {
    let total = 0;
    for (const balance of Object.values(state.balances)) {
      const price = MOCK_PRICES[balance.symbol] || 0;
      total += balance.borrowed * price;
    }
    return total;
  }, [state.balances]);

  const getSimulatedHealthFactor = useCallback(() => {
    const totalBorrows = getSimulatedTotalBorrows();
    if (totalBorrows === 0) return Infinity;

    let weightedCollateral = 0;
    for (const balance of Object.values(state.balances)) {
      const price = MOCK_PRICES[balance.symbol] || 0;
      const collateralFactor = COLLATERAL_FACTORS[balance.symbol] || 0.75;
      weightedCollateral += balance.supplied * price * collateralFactor;
    }

    return weightedCollateral / totalBorrows;
  }, [state.balances, getSimulatedTotalBorrows]);

  const addTransaction = useCallback((
    type: SimulatedTransaction['type'],
    symbol: string,
    amount: number,
    healthFactorBefore: number,
    healthFactorAfter: number
  ) => {
    const transaction: SimulatedTransaction = {
      id: `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      symbol,
      amount,
      timestamp: Date.now(),
      healthFactorBefore,
      healthFactorAfter,
    };

    setState(prev => ({
      ...prev,
      transactionHistory: [transaction, ...prev.transactionHistory].slice(0, 50),
    }));
  }, []);

  const simulateSupply = useCallback((symbol: string, amount: number): boolean => {
    const balance = state.balances[symbol];
    if (!balance || amount <= 0 || amount > balance.wallet) {
      return false;
    }

    const healthBefore = getSimulatedHealthFactor();

    setState(prev => ({
      ...prev,
      balances: {
        ...prev.balances,
        [symbol]: {
          ...prev.balances[symbol],
          wallet: prev.balances[symbol].wallet - amount,
          supplied: prev.balances[symbol].supplied + amount,
        },
      },
    }));

    // Calculate new health factor after state update
    setTimeout(() => {
      addTransaction('supply', symbol, amount, healthBefore, getSimulatedHealthFactor());
    }, 0);

    return true;
  }, [state.balances, getSimulatedHealthFactor, addTransaction]);

  const simulateWithdraw = useCallback((symbol: string, amount: number): boolean => {
    const balance = state.balances[symbol];
    if (!balance || amount <= 0 || amount > balance.supplied) {
      return false;
    }

    // Check if withdrawal would cause liquidation
    const price = MOCK_PRICES[symbol] || 0;
    const collateralFactor = COLLATERAL_FACTORS[symbol] || 0.75;
    const currentWeightedCollateral = getSimulatedTotalCollateral() * 0.75; // Simplified
    const withdrawValueWeighted = amount * price * collateralFactor;
    const newWeightedCollateral = currentWeightedCollateral - withdrawValueWeighted;
    const totalBorrows = getSimulatedTotalBorrows();

    if (totalBorrows > 0 && newWeightedCollateral / totalBorrows < 1.0) {
      return false; // Would cause liquidation
    }

    const healthBefore = getSimulatedHealthFactor();

    setState(prev => ({
      ...prev,
      balances: {
        ...prev.balances,
        [symbol]: {
          ...prev.balances[symbol],
          wallet: prev.balances[symbol].wallet + amount,
          supplied: prev.balances[symbol].supplied - amount,
        },
      },
    }));

    setTimeout(() => {
      addTransaction('withdraw', symbol, amount, healthBefore, getSimulatedHealthFactor());
    }, 0);

    return true;
  }, [state.balances, getSimulatedTotalCollateral, getSimulatedTotalBorrows, getSimulatedHealthFactor, addTransaction]);

  const simulateBorrow = useCallback((symbol: string, amount: number): boolean => {
    if (amount <= 0) return false;

    // Check borrowing capacity
    const totalCollateral = getSimulatedTotalCollateral();
    const currentBorrows = getSimulatedTotalBorrows();
    const price = MOCK_PRICES[symbol] || 0;
    const borrowValue = amount * price;
    const maxBorrow = totalCollateral * 0.75; // 75% LTV limit

    if (currentBorrows + borrowValue > maxBorrow) {
      return false; // Exceeds borrowing capacity
    }

    const healthBefore = getSimulatedHealthFactor();

    setState(prev => ({
      ...prev,
      balances: {
        ...prev.balances,
        [symbol]: {
          ...prev.balances[symbol],
          wallet: prev.balances[symbol].wallet + amount,
          borrowed: prev.balances[symbol].borrowed + amount,
        },
      },
    }));

    setTimeout(() => {
      addTransaction('borrow', symbol, amount, healthBefore, getSimulatedHealthFactor());
    }, 0);

    return true;
  }, [getSimulatedTotalCollateral, getSimulatedTotalBorrows, getSimulatedHealthFactor, addTransaction]);

  const simulateRepay = useCallback((symbol: string, amount: number): boolean => {
    const balance = state.balances[symbol];
    if (!balance || amount <= 0 || amount > balance.borrowed || amount > balance.wallet) {
      return false;
    }

    const healthBefore = getSimulatedHealthFactor();

    setState(prev => ({
      ...prev,
      balances: {
        ...prev.balances,
        [symbol]: {
          ...prev.balances[symbol],
          wallet: prev.balances[symbol].wallet - amount,
          borrowed: prev.balances[symbol].borrowed - amount,
        },
      },
    }));

    setTimeout(() => {
      addTransaction('repay', symbol, amount, healthBefore, getSimulatedHealthFactor());
    }, 0);

    return true;
  }, [state.balances, getSimulatedHealthFactor, addTransaction]);

  const startSimulation = useCallback(() => {
    setState(prev => ({ ...prev, isActive: true }));
  }, []);

  const stopSimulation = useCallback(() => {
    setState(prev => ({ ...prev, isActive: false }));
  }, []);

  const resetSimulation = useCallback(() => {
    setState({
      isActive: state.isActive,
      balances: getInitialBalances(),
      transactionHistory: [],
    });
  }, [state.isActive]);

  return (
    <SimulationContext.Provider
      value={{
        isSimulationMode: state.isActive,
        startSimulation,
        stopSimulation,
        resetSimulation,
        simulatedBalances: state.balances,
        simulatedTransactions: state.transactionHistory,
        simulateSupply,
        simulateWithdraw,
        simulateBorrow,
        simulateRepay,
        getSimulatedHealthFactor,
        getSimulatedTotalCollateral,
        getSimulatedTotalBorrows,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}

// Helper hook for components that need to know if we're in simulation mode
export function useIsSimulationMode() {
  const context = useContext(SimulationContext);
  return context?.isSimulationMode ?? false;
}
