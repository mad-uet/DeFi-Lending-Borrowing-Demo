'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from './useWeb3';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'liquidation';
  asset: string;
  amount: string;
  timestamp: number;
  txHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  healthFactorBefore?: number;
  healthFactorAfter?: number;
}

const STORAGE_KEY = 'defi_lebo_tx_history';
const MAX_TRANSACTIONS = 50;

export function useTransactionHistory() {
  const { account } = useWeb3();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load transactions from session storage
  useEffect(() => {
    if (!account) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    try {
      const stored = sessionStorage.getItem(`${STORAGE_KEY}_${account}`);
      if (stored) {
        const parsed = JSON.parse(stored) as Transaction[];
        setTransactions(parsed);
      }
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    }
    setIsLoading(false);
  }, [account]);

  // Save transactions to session storage
  const saveTransactions = useCallback((txs: Transaction[]) => {
    if (!account) return;
    try {
      // Keep only the most recent transactions
      const trimmed = txs.slice(0, MAX_TRANSACTIONS);
      sessionStorage.setItem(`${STORAGE_KEY}_${account}`, JSON.stringify(trimmed));
      setTransactions(trimmed);
    } catch (error) {
      console.error('Failed to save transaction history:', error);
    }
  }, [account]);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    
    setTransactions(prev => {
      const updated = [newTx, ...prev];
      saveTransactions(updated);
      return updated;
    });

    return newTx.id;
  }, [saveTransactions]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => {
      const updated = prev.map(tx => 
        tx.id === id ? { ...tx, ...updates } : tx
      );
      saveTransactions(updated);
      return updated;
    });
  }, [saveTransactions]);

  const clearHistory = useCallback(() => {
    if (!account) return;
    sessionStorage.removeItem(`${STORAGE_KEY}_${account}`);
    setTransactions([]);
  }, [account]);

  const getRecentTransactions = useCallback((count: number = 5) => {
    return transactions.slice(0, count);
  }, [transactions]);

  const getTransactionsByType = useCallback((type: Transaction['type']) => {
    return transactions.filter(tx => tx.type === type);
  }, [transactions]);

  return {
    transactions,
    isLoading,
    addTransaction,
    updateTransaction,
    clearHistory,
    getRecentTransactions,
    getTransactionsByType,
  };
}
