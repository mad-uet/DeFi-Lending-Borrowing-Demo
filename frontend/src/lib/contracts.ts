'use client';

import { TokenConfig } from '@/types';

// Prevent Turbopack from deleting this module during HMR
export const __contracts_module__ = true;

// Contract ABIs - Import from artifacts
export const LENDING_POOL_ABI = [
  "function deposit(address token, uint256 amount) external",
  "function withdraw(address token, uint256 amount) external",
  "function borrow(address token, uint256 amount) external",
  "function repay(address token, uint256 amount) external",
  "function getUserDeposit(address user, address token) external view returns (uint256)",
  "function getUserBorrow(address user, address token) external view returns (uint256)",
  "function getTokenBalance(address token) external view returns (uint256)",
  "function calculateHealthFactor(address user) external view returns (uint256)",
  "function getBorrowRate(address token) external view returns (uint256)",
  "function getSupplyRate(address token) external view returns (uint256)",
  "function supportedTokens(uint256) external view returns (address)",
  "function tokenConfigs(address) external view returns (address tokenAddress, uint16 ltv, bool isActive)",
  "function getUserLARRewards(address user) external view returns (uint256)",
  "function getSupportedTokensCount() external view returns (uint256)",
  "function totalDeposits(address) external view returns (uint256)",
  "function totalBorrows(address) external view returns (uint256)",
  "function getUserAccountData(address user) external view returns (uint256 totalCollateralUSD, uint256 totalDebtUSD, uint256 availableBorrowsUSD, uint256 healthFactor)",
  "event Deposit(address indexed user, address indexed token, uint256 amount, uint256 larMinted)",
  "event Withdraw(address indexed user, address indexed token, uint256 amount)",
  "event Borrow(address indexed user, address indexed token, uint256 amount, uint256 interestRate)",
  "event Repay(address indexed user, address indexed token, uint256 amount, uint256 interest)"
];

export const LAR_TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)"
];

export const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)",
  "function mint(address to, uint256 amount) external"
];

export const PRICE_ORACLE_ABI = [
  "function getPrice(address token) external view returns (uint256)",
  "function updatePrice(address token) external"
];

export const INTEREST_RATE_MODEL_ABI = [
  "function calculateBorrowRate(uint256 borrowed, uint256 supplied) external view returns (uint256)",
  "function calculateSupplyRate(uint256 borrowed, uint256 supplied, uint256 reserveFactor) external view returns (uint256)"
];

// Contract addresses from environment variables
export const ADDRESSES = {
  LendingPool: process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS || '',
  LARToken: process.env.NEXT_PUBLIC_LAR_TOKEN_ADDRESS || '',
  InterestRateModel: process.env.NEXT_PUBLIC_INTEREST_RATE_MODEL_ADDRESS || '',
  PriceOracle: process.env.NEXT_PUBLIC_PRICE_ORACLE_ADDRESS || '',
  WETH: process.env.NEXT_PUBLIC_WETH_ADDRESS || '',
  DAI: process.env.NEXT_PUBLIC_DAI_ADDRESS || '',
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '',
  LINK: process.env.NEXT_PUBLIC_LINK_ADDRESS || '',
};

// Token configurations
export const TOKEN_CONFIGS: Record<string, TokenConfig> = {
  WETH: {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    address: ADDRESSES.WETH,
    collateralFactor: 0.75, // 75% LTV
    liquidationThreshold: 0.80, // 80%
  },
  DAI: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    address: ADDRESSES.DAI,
    collateralFactor: 0.80, // 80% LTV
    liquidationThreshold: 0.85, // 85%
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: ADDRESSES.USDC,
    collateralFactor: 0.80, // 80% LTV
    liquidationThreshold: 0.85, // 85%
  },
  LINK: {
    symbol: 'LINK',
    name: 'Chainlink',
    decimals: 18,
    address: ADDRESSES.LINK,
    collateralFactor: 0.70, // 70% LTV
    liquidationThreshold: 0.75, // 75%
  },
};

export const SUPPORTED_TOKENS = Object.values(TOKEN_CONFIGS);

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 31337;

export const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum Mainnet',
  31337: 'Hardhat Local',
  11155111: 'Sepolia Testnet',
};
