'use client';

import { useState, useEffect } from 'react';
import { useLiquidationMonitor } from '../hooks/useLiquidationMonitor';

interface LiquidationWarningProps {
  onDismiss?: () => void;
  showTrend?: boolean;
}

export function LiquidationWarning({ onDismiss, showTrend = true }: LiquidationWarningProps) {
  const { isAtRisk, isDanger, healthFactorTrend, isMonitoring } = useLiquidationMonitor();
  const [dismissed, setDismissed] = useState(false);
  const [shake, setShake] = useState(false);

  // Reset dismissed state when danger level changes
  useEffect(() => {
    if (isDanger && !dismissed) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    // When transitioning from danger back to at-risk, reset dismissed
    if (!isDanger && isAtRisk) {
      setDismissed(false);
    }
  }, [isDanger, isAtRisk, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (!isMonitoring || dismissed || (!isAtRisk && !isDanger)) {
    return null;
  }

  const formatHealthFactor = (value: number) => {
    if (!isFinite(value)) return '∞';
    return value.toFixed(2);
  };

  const getTrendIcon = () => {
    switch (healthFactorTrend.trend) {
      case 'improving':
        return (
          <span className="inline-flex items-center text-green-400">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span className="text-xs">+{Math.abs(healthFactorTrend.changePercent).toFixed(1)}%</span>
          </span>
        );
      case 'worsening':
        return (
          <span className="inline-flex items-center text-red-400">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-xs">-{Math.abs(healthFactorTrend.changePercent).toFixed(1)}%</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-gray-400">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            <span className="text-xs">Stable</span>
          </span>
        );
    }
  };

  if (isDanger) {
    return (
      <div 
        className={`relative overflow-hidden rounded-lg border-2 border-red-500 bg-gradient-to-r from-red-900/90 via-red-800/90 to-red-900/90 p-4 shadow-lg shadow-red-500/20 ${shake ? 'animate-wiggle' : ''}`}
        role="alert"
      >
        {/* Animated danger stripes */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(220,38,38,0.1)_10px,rgba(220,38,38,0.1)_20px)] animate-slide-stripes pointer-events-none" />
        
        <div className="relative flex items-start gap-3">
          {/* Pulsing warning icon */}
          <div className="flex-shrink-0 animate-pulse-glow">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-red-100 animate-pulse">
                ⚠️ LIQUIDATION IMMINENT
              </h3>
              {showTrend && getTrendIcon()}
            </div>
            
            <p className="text-red-200 text-sm mb-2">
              Your health factor is <strong className="text-white text-lg">{formatHealthFactor(healthFactorTrend.current)}</strong>.
              Your position may be liquidated at any moment!
            </p>
            
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1.5 bg-green-500 hover:bg-green-400 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Collateral
              </button>
              <button className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Repay Debt
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-red-300 hover:text-white transition-colors p-1"
            aria-label="Dismiss warning"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // At-risk warning (less severe)
  return (
    <div 
      className="relative overflow-hidden rounded-lg border border-yellow-500/50 bg-gradient-to-r from-yellow-900/50 via-yellow-800/50 to-yellow-900/50 p-3 shadow-lg"
      role="alert"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-yellow-200 text-sm">
              Health Factor: <strong className="text-yellow-100">{formatHealthFactor(healthFactorTrend.current)}</strong>
            </span>
            {showTrend && getTrendIcon()}
          </div>
          <p className="text-yellow-300/80 text-xs mt-0.5">
            Consider adding collateral or repaying debt to avoid liquidation
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-yellow-400/60 hover:text-yellow-200 transition-colors p-1"
          aria-label="Dismiss warning"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function LiquidationWarningBanner() {
  return (
    <div className="animate-slide-in-up">
      <LiquidationWarning />
    </div>
  );
}
