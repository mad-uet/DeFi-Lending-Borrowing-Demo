import { BrowserProvider, Signer, Contract } from 'ethers';

export interface Web3State {
  provider: BrowserProvider | null;
  signer: Signer | null;
  account: string;
  isConnected: boolean;
  chainId: number;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export interface Asset {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}

export interface SupplyAsset extends Asset {
  supplyAPY: string;
  totalSupplied: string;
  totalSuppliedUSD: string;
  walletBalance: string;
  walletBalanceUSD: string;
  canBeCollateral: boolean;
}

export interface BorrowAsset extends Asset {
  borrowAPY: string;
  availableToBorrow: string;
  availableToBorrowUSD: string;
  totalBorrowed: string;
  totalBorrowedUSD: string;
  yourBorrows: string;
  yourBorrowsUSD: string;
  maxBorrow: string;
  maxBorrowUSD: string;
}

export interface UserSupply {
  asset: Asset;
  supplied: string;
  suppliedUSD: string;
  larEarned: string;
  apy: string;
  isCollateral: boolean;
}

export interface UserBorrow {
  asset: Asset;
  borrowed: string;
  borrowedUSD: string;
  accruedInterest: string;
  totalDebt: string;
  totalDebtUSD: string;
  apy: string;
}

export interface UserPosition {
  totalSuppliedUSD: string;
  totalBorrowedUSD: string;
  totalCollateralUSD: string;
  availableToBorrowUSD: string;
  healthFactor: string;
  larEarned: string;
  netAPY: string;
}

export interface TransactionStatus {
  status: 'idle' | 'approving' | 'pending' | 'success' | 'error';
  message: string;
  hash?: string;
  error?: string;
}

export interface TokenConfig {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  collateralFactor: number; // e.g., 0.75 for 75%
  liquidationThreshold: number; // e.g., 0.80 for 80%
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
