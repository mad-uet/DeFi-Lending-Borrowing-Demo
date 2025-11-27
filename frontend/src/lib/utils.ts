import { formatUnits, parseUnits } from 'ethers';

/**
 * Format a token amount to human-readable format
 * Handles both raw bigint/wei values and pre-formatted strings
 */
export function formatTokenAmount(
  amount: bigint | string | number,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  try {
    let num: number;
    
    // If it's already a formatted string (contains decimal point or is a reasonable number string)
    if (typeof amount === 'string') {
      // Check if it's a wei-like string (no decimal, very long) or already formatted
      if (amount.includes('.') || (amount.length < 15 && !amount.startsWith('0x'))) {
        // Already formatted, just parse as float
        num = parseFloat(amount);
      } else {
        // Wei-like string, needs conversion
        const formatted = formatUnits(amount, decimals);
        num = parseFloat(formatted);
      }
    } else if (typeof amount === 'number') {
      num = amount;
    } else if (typeof amount === 'bigint') {
      const formatted = formatUnits(amount, decimals);
      num = parseFloat(formatted);
    } else {
      return '0';
    }
    
    // Handle invalid numbers
    if (isNaN(num) || !isFinite(num)) return '0';
    if (num === 0) return '0';
    if (num < 0.0001 && num > 0) return '< 0.0001';
    
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: displayDecimals,
    });
  } catch (error) {
    console.error('Error formatting token amount:', error, { amount, decimals });
    return '0';
  }
}

/**
 * Format USD value
 */
export function formatUSD(amount: number | string): string {
  try {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Handle invalid numbers
    if (isNaN(num) || !isFinite(num)) return '$0.00';
    if (num === 0) return '$0.00';
    if (num < 0.01 && num > 0) return '< $0.01';
    
    return num.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch (error) {
    console.error('Error formatting USD:', error, { amount });
    return '$0.00';
  }
}

/**
 * Format percentage
 */
export function formatPercent(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${num.toFixed(decimals)}%`;
}

/**
 * Truncate Ethereum address
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Parse token amount to wei
 */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  try {
    if (!amount || amount === '') return BigInt(0);
    return parseUnits(amount, decimals);
  } catch (error) {
    console.error('Error parsing token amount:', error);
    return BigInt(0);
  }
}

/**
 * Calculate health factor color
 */
export function getHealthFactorColor(healthFactor: string): string {
  const hf = parseFloat(healthFactor);
  
  if (hf >= 1.5) return 'text-health-safe';
  if (hf >= 1.0) return 'text-health-warning';
  return 'text-health-danger';
}

/**
 * Calculate health factor status
 */
export function getHealthFactorStatus(healthFactor: string): 'safe' | 'warning' | 'danger' {
  const hf = parseFloat(healthFactor);
  
  if (hf >= 1.5) return 'safe';
  if (hf >= 1.0) return 'warning';
  return 'danger';
}

/**
 * Convert basis points to percentage
 */
export function bpsToPercent(bps: bigint | number | string): number {
  try {
    let num: number;
    if (typeof bps === 'bigint') {
      num = Number(bps);
    } else if (typeof bps === 'string') {
      num = parseFloat(bps);
    } else {
      num = bps;
    }
    
    // Handle invalid numbers
    if (isNaN(num) || !isFinite(num)) return 0;
    
    return num / 100;
  } catch (error) {
    console.error('Error converting bps to percent:', error, { bps });
    return 0;
  }
}

/**
 * Format time ago
 */
export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Calculate max borrow amount based on health factor
 */
export function calculateMaxBorrow(
  totalCollateralUSD: number,
  currentBorrowUSD: number,
  collateralFactor: number,
  targetHealthFactor: number = 1.5
): number {
  // Max borrow = (totalCollateral * collateralFactor / targetHealthFactor) - currentBorrow
  const maxBorrow = (totalCollateralUSD * collateralFactor / targetHealthFactor) - currentBorrowUSD;
  return Math.max(0, maxBorrow);
}

/**
 * Calculate new health factor after borrow
 */
export function calculateNewHealthFactor(
  totalCollateralUSD: number,
  currentBorrowUSD: number,
  newBorrowUSD: number,
  liquidationThreshold: number
): number {
  const totalBorrow = currentBorrowUSD + newBorrowUSD;
  if (totalBorrow === 0) return Infinity;
  
  return (totalCollateralUSD * liquidationThreshold) / totalBorrow;
}

/**
 * Format APY with proper decimals
 */
export function formatAPY(apy: number | string): string {
  try {
    const num = typeof apy === 'string' ? parseFloat(apy) : apy;
    
    // Handle invalid numbers
    if (isNaN(num) || !isFinite(num)) return '0.00%';
    if (num === 0) return '0.00%';
    if (num < 0.01 && num > 0) return '< 0.01%';
    if (num > 1000) return '> 1000%';
    
    return `${num.toFixed(2)}%`;
  } catch (error) {
    console.error('Error formatting APY:', error, { apy });
    return '0.00%';
  }
}

/**
 * Safe BigInt conversion
 */
export function safeBigInt(value: any): bigint {
  try {
    if (typeof value === 'bigint') return value;
    if (typeof value === 'number') return BigInt(Math.floor(value));
    if (typeof value === 'string') return BigInt(value);
    return BigInt(0);
  } catch {
    return BigInt(0);
  }
}
