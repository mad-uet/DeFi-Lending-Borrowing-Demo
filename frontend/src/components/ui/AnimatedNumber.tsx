'use client';

import { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  showChange?: boolean;
  formatFn?: (value: number) => string;
}

export function AnimatedNumber({
  value,
  duration = 500,
  decimals = 2,
  prefix = '',
  suffix = '',
  className = '',
  showChange = false,
  formatFn,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [changeDirection, setChangeDirection] = useState<'up' | 'down' | null>(null);
  const previousValue = useRef(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    // Determine change direction for visual feedback
    if (showChange && startValue !== endValue) {
      setChangeDirection(endValue > startValue ? 'up' : 'down');
      setTimeout(() => setChangeDirection(null), 1000);
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, showChange]);

  const formattedValue = formatFn 
    ? formatFn(displayValue)
    : displayValue.toFixed(decimals);

  const changeClass = changeDirection === 'up' 
    ? 'text-green-400 animate-bounce-subtle' 
    : changeDirection === 'down' 
      ? 'text-red-400 animate-wiggle'
      : '';

  return (
    <span className={`tabular-nums transition-colors duration-300 ${changeClass} ${className}`}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

// Compact number formatter for large values
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

// Currency formatter
export function AnimatedCurrency({
  value,
  currency = 'USD',
  ...props
}: AnimatedNumberProps & { currency?: string }) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return <AnimatedNumber {...props} value={value} formatFn={formatCurrency} />;
}

// Percentage formatter
export function AnimatedPercentage({
  value,
  ...props
}: Omit<AnimatedNumberProps, 'suffix'>) {
  return <AnimatedNumber {...props} value={value} suffix="%" />;
}
