'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

// Helper to get storage key for account
function getStorageKey(account: string | null): string | null {
  if (!account) return null;
  return `${STORAGE_KEY}_${account.toLowerCase()}`;
}

// Helper to load transactions from localStorage (persists across sessions)
function loadTransactions(account: string | null): Transaction[] {
  const key = getStorageKey(account);
  if (!key) return [];
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as Transaction[];
    }
  } catch (error) {
    console.error('Failed to load transaction history:', error);
  }
  return [];
}

// Helper to save transactions to localStorage
function saveTransactionsToStorage(account: string | null, txs: Transaction[]): void {
  const key = getStorageKey(account);
  if (!key) return;
  try {
    const trimmed = txs.slice(0, MAX_TRANSACTIONS);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save transaction history:', error);
  }
}

export function useTransactionHistory() {
  const { account } = useWeb3();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use ref to always have current account value in callbacks
  const accountRef = useRef(account);
  accountRef.current = account;

  // Load transactions from localStorage on mount and when account changes
  useEffect(() => {
    const loaded = loadTransactions(account);
    setTransactions(loaded);
    setIsLoading(false);
  }, [account]);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const currentAccount = accountRef.current;
    
    const newTx: Transaction = {
      ...tx,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    
    setTransactions(prev => {
      const updated = [newTx, ...prev];
      // Save directly using current account from ref
      saveTransactionsToStorage(currentAccount, updated);
      return updated;
    });

    console.log('[TxHistory] Added transaction:', newTx.type, newTx.asset, newTx.amount);
    return newTx.id;
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    const currentAccount = accountRef.current;
    
    setTransactions(prev => {
      const updated = prev.map(tx => 
        tx.id === id ? { ...tx, ...updates } : tx
      );
      saveTransactionsToStorage(currentAccount, updated);
      return updated;
    });
    
    console.log('[TxHistory] Updated transaction:', id, updates);
  }, []);

  const clearHistory = useCallback(() => {
    const key = getStorageKey(accountRef.current);
    if (key) {
      localStorage.removeItem(key);
    }
    setTransactions([]);
  }, []);

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
