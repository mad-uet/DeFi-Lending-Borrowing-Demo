'use client';

import { useState } from 'react';

interface TokenIconProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const TOKEN_COLORS: Record<string, { bg: string; text: string; gradient: string }> = {
  ETH: { 
    bg: 'bg-blue-500', 
    text: 'text-white',
    gradient: 'from-blue-400 to-indigo-600'
  },
  WETH: { 
    bg: 'bg-blue-500', 
    text: 'text-white',
    gradient: 'from-blue-400 to-indigo-600'
  },
  USDC: { 
    bg: 'bg-blue-600', 
    text: 'text-white',
    gradient: 'from-blue-500 to-blue-700'
  },
  USDT: { 
    bg: 'bg-green-500', 
    text: 'text-white',
    gradient: 'from-green-400 to-emerald-600'
  },
  DAI: { 
    bg: 'bg-yellow-500', 
    text: 'text-gray-900',
    gradient: 'from-yellow-400 to-amber-600'
  },
  WBTC: { 
    bg: 'bg-orange-500', 
    text: 'text-white',
    gradient: 'from-orange-400 to-orange-600'
  },
  BTC: { 
    bg: 'bg-orange-500', 
    text: 'text-white',
    gradient: 'from-orange-400 to-orange-600'
  },
  LINK: { 
    bg: 'bg-blue-600', 
    text: 'text-white',
    gradient: 'from-blue-500 to-blue-700'
  },
  UNI: { 
    bg: 'bg-pink-500', 
    text: 'text-white',
    gradient: 'from-pink-400 to-rose-600'
  },
  AAVE: { 
    bg: 'bg-purple-500', 
    text: 'text-white',
    gradient: 'from-purple-400 to-purple-700'
  },
  LAR: { 
    bg: 'bg-gradient-to-br from-primary-400 to-primary-600', 
    text: 'text-white',
    gradient: 'from-primary-400 to-primary-600'
  },
  MOCK: { 
    bg: 'bg-gray-500', 
    text: 'text-white',
    gradient: 'from-gray-400 to-gray-600'
  },
};

const DEFAULT_COLOR = { 
  bg: 'bg-gray-600', 
  text: 'text-white',
  gradient: 'from-gray-500 to-gray-700'
};

const SIZES = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
  xl: 'w-12 h-12 text-lg',
};

export function TokenIcon({ 
  symbol, 
  size = 'md', 
  showLabel = false,
  animated = true,
  className = '' 
}: TokenIconProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = TOKEN_COLORS[symbol.toUpperCase()] || DEFAULT_COLOR;
  const sizeClass = SIZES[size];
  
  // Get first 1-2 letters for display
  const displayText = symbol.length <= 3 ? symbol : symbol.slice(0, 2);

  return (
    <div 
      className={`inline-flex items-center gap-2 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`
          ${sizeClass}
          rounded-full 
          bg-gradient-to-br ${colors.gradient}
          flex items-center justify-center 
          font-bold ${colors.text}
          shadow-lg
          transition-all duration-300
          ${animated && isHovered ? 'scale-110 shadow-xl' : ''}
          ${animated ? 'hover:rotate-12' : ''}
        `}
      >
        {displayText}
      </div>
      
      {showLabel && (
        <span className="font-medium text-gray-200">{symbol}</span>
      )}
    </div>
  );
}

// Token icon with price change indicator
interface TokenIconWithPriceProps extends TokenIconProps {
  price?: number;
  priceChange?: number; // percentage
}

export function TokenIconWithPrice({
  symbol,
  price,
  priceChange,
  size = 'md',
  ...props
}: TokenIconWithPriceProps) {
  const formatPrice = (p: number) => {
    if (p >= 1000) return `$${(p / 1000).toFixed(1)}K`;
    if (p >= 1) return `$${p.toFixed(2)}`;
    return `$${p.toFixed(4)}`;
  };

  return (
    <div className="flex items-center gap-2">
      <TokenIcon symbol={symbol} size={size} {...props} />
      <div className="flex flex-col">
        <span className="font-medium text-gray-200">{symbol}</span>
        {price !== undefined && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">{formatPrice(price)}</span>
            {priceChange !== undefined && (
              <span className={`text-xs ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Stacked token icons (for pairs)
interface TokenPairProps {
  token1: string;
  token2: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TokenPair({ token1, token2, size = 'md' }: TokenPairProps) {
  return (
    <div className="relative inline-flex items-center">
      <TokenIcon symbol={token1} size={size} animated={false} />
      <div className="-ml-2">
        <TokenIcon symbol={token2} size={size} animated={false} />
      </div>
    </div>
  );
}

// Loading skeleton for token icon
export function TokenIconSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClass = SIZES[size];
  
  return (
    <div 
      className={`${sizeClass} rounded-full bg-gray-700 animate-pulse`}
    />
  );
}
