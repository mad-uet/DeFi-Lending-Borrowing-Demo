'use client';

// Hover effects and micro-interactions

import { ReactNode, useState } from 'react';

// Hover reveal - shows content on hover
interface HoverRevealProps {
  trigger: ReactNode;
  content: ReactNode;
  direction?: 'top' | 'bottom' | 'left' | 'right';
}

export function HoverReveal({ trigger, content, direction = 'top' }: HoverRevealProps) {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative group inline-block">
      {trigger}
      <div className={`absolute ${positionClasses[direction]} opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-50`}>
        {content}
      </div>
    </div>
  );
}

// Tooltip
interface TooltipProps {
  children: ReactNode;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, text, position = 'top' }: TooltipProps) {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900',
  };

  return (
    <div className="relative group inline-block">
      {children}
      <div className={`absolute ${positionClasses[position]} opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50`}>
        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
          {text}
        </div>
        <div className={`absolute ${arrowClasses[position]} border-4 border-transparent`} />
      </div>
    </div>
  );
}

// Scale on hover wrapper
interface ScaleHoverProps {
  children: ReactNode;
  scale?: number;
  className?: string;
}

export function ScaleHover({ children, scale = 1.05, className = '' }: ScaleHoverProps) {
  return (
    <div 
      className={`transition-transform duration-200 hover:scale-[${scale}] ${className}`}
      style={{ '--tw-scale-x': scale, '--tw-scale-y': scale } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// Lift on hover (shadow + translate)
export function LiftHover({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${className}`}>
      {children}
    </div>
  );
}

// Glow effect on hover
interface GlowHoverProps {
  children: ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function GlowHover({ children, color = 'primary', className = '' }: GlowHoverProps) {
  const glowColors = {
    primary: 'hover:shadow-primary-500/50',
    success: 'hover:shadow-green-500/50',
    warning: 'hover:shadow-yellow-500/50',
    danger: 'hover:shadow-red-500/50',
  };

  return (
    <div className={`transition-shadow duration-300 hover:shadow-lg ${glowColors[color]} ${className}`}>
      {children}
    </div>
  );
}

// Pulse attention grabber
export function PulseAttention({ children, active = true }: { children: ReactNode; active?: boolean }) {
  return (
    <div className={`relative ${active ? 'animate-pulse-slow' : ''}`}>
      {children}
      {active && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
      )}
    </div>
  );
}

// Bounce on click
export function BounceClick({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 150);
  };

  return (
    <div 
      onClick={handleClick}
      className={`transition-transform duration-150 ${clicked ? 'scale-95' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

// Progress ring
interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: ReactNode;
}

export function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 4,
  color = '#3b82f6',
  bgColor = '#374151',
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

// Typing effect
interface TypingEffectProps {
  text: string;
  speed?: number;
  className?: string;
}

export function TypingEffect({ text, speed = 50, className = '' }: TypingEffectProps) {
  const [displayText, setDisplayText] = useState('');

  useState(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayText(text.slice(0, index + 1));
      index++;
      if (index >= text.length) {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  });

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
}

// Highlight text on scroll into view
export function HighlightOnView({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={`transition-all duration-500 ${isVisible ? 'bg-yellow-500/20' : ''} ${className}`}
      ref={(el) => {
        if (el) {
          const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0.5 }
          );
          observer.observe(el);
        }
      }}
    >
      {children}
    </div>
  );
}
