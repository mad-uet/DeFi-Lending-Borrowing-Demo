import { BrowserProvider, Signer, Contract } from 'ethers';

export interface Web3State {
  provider: BrowserProvider | null;
  signer: Signer | null;
  account: string;
  isConnected: boolean;
  chainId: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork?: () => Promise<void>;
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

// Liquidation Types
export interface LiquidationEvent {
  id: string;
  borrower: string;
  liquidator: string;
  debtToken: string;
  debtTokenSymbol: string;
  debtAmount: string;
  debtAmountUSD: string;
  collateralToken: string;
  collateralTokenSymbol: string;
  collateralSeized: string;
  collateralSeizedUSD: string;
  liquidationBonus: string;
  liquidationBonusUSD: string;
  timestamp: number;
  transactionHash?: string;
  healthFactorBefore: string;
  healthFactorAfter: string;
}

export interface LiquidatablePosition {
  borrower: string;
  healthFactor: number;
  totalDebtUSD: string;
  totalCollateralUSD: string;
  maxLiquidationUSD: string; // 50% of debt
  potentialProfit: string; // 5% bonus in USD
  debts: {
    token: string;
    symbol: string;
    amount: string;
    amountUSD: string;
  }[];
  collaterals: {
    token: string;
    symbol: string;
    amount: string;
    amountUSD: string;
  }[];
}

export interface LiquidatorStats {
  totalLiquidations: number;
  totalDebtRepaid: string;
  totalCollateralSeized: string;
  totalProfitUSD: string;
  liquidationHistory: LiquidationEvent[];
}

export interface SimulatedLiquidator {
  address: string;
  name: string;
  balance: Record<string, string>; // token symbol => balance
  isActive: boolean;
  autoLiquidate: boolean;
  liquidationDelay: number; // seconds to wait before auto-liquidation
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
