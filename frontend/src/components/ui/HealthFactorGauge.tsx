'use client';

import { useMemo } from 'react';

interface HealthFactorGaugeProps {
  currentValue: number;
  newValue?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  animated?: boolean;
}

export default function HealthFactorGauge({
  currentValue,
  newValue,
  size = 'md',
  showLabels = true,
  animated = true,
}: HealthFactorGaugeProps) {
  const sizeConfig = {
    sm: { outer: 80, inner: 60, strokeWidth: 8, fontSize: 'text-lg' },
    md: { outer: 120, inner: 90, strokeWidth: 12, fontSize: 'text-2xl' },
    lg: { outer: 160, inner: 120, strokeWidth: 16, fontSize: 'text-3xl' },
  };

  const config = sizeConfig[size];
  const radius = (config.outer - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate angle based on health factor (0 to 3+ maps to 0 to 270 degrees)
  const calculateProgress = (value: number) => {
    if (!isFinite(value)) return 1; // Full circle for infinite
    const clampedValue = Math.min(Math.max(value, 0), 3);
    return clampedValue / 3;
  };

  const getColor = (value: number) => {
    if (!isFinite(value) || value >= 1.5) return { stroke: '#22c55e', class: 'text-health-safe' };
    if (value >= 1.0) return { stroke: '#f59e0b', class: 'text-health-warning' };
    return { stroke: '#ef4444', class: 'text-health-danger' };
  };

  const currentProgress = calculateProgress(currentValue);
  const newProgress = newValue !== undefined ? calculateProgress(newValue) : null;

  const currentColor = getColor(currentValue);
  const newColor = newValue !== undefined ? getColor(newValue) : null;

  const currentOffset = circumference * (1 - currentProgress * 0.75); // 270 degrees = 0.75 of circle
  const newOffset = newProgress !== null ? circumference * (1 - newProgress * 0.75) : null;

  const formatValue = (value: number) => {
    if (!isFinite(value)) return '∞';
    if (value > 100) return '> 100';
    return value.toFixed(2);
  };

  const isImproving = newValue !== undefined && newValue > currentValue;
  const isWorsening = newValue !== undefined && newValue < currentValue;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: config.outer, height: config.outer }}>
        <svg
          width={config.outer}
          height={config.outer}
          viewBox={`0 0 ${config.outer} ${config.outer}`}
          className="transform -rotate-135"
        >
          {/* Background arc */}
          <circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          />

          {/* Current value arc */}
          <circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius}
            fill="none"
            stroke={currentColor.stroke}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={currentOffset}
            className={animated ? 'transition-all duration-700 ease-out' : ''}
          />

          {/* New value arc (preview) */}
          {newOffset !== null && newColor && (
            <circle
              cx={config.outer / 2}
              cy={config.outer / 2}
              r={radius - config.strokeWidth / 2 - 2}
              fill="none"
              stroke={newColor.stroke}
              strokeWidth={config.strokeWidth / 2}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={newOffset}
              opacity={0.6}
              className={`${animated ? 'transition-all duration-500 ease-out' : ''} ${isWorsening ? 'animate-pulse' : ''}`}
            />
          )}
        </svg>

        {/* Center value display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`font-bold ${config.fontSize} ${currentColor.class}`}>
            {formatValue(currentValue)}
          </div>
          {newValue !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              <svg
                className={`w-4 h-4 ${isImproving ? 'text-green-500 rotate-180' : 'text-red-500'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
              <span className={newColor?.class}>{formatValue(newValue)}</span>
            </div>
          )}
        </div>
      </div>

      {showLabels && (
        <div className="mt-2 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">Health Factor</div>
          {newValue !== undefined && (
            <div className={`text-xs font-medium mt-1 ${
              isWorsening && newValue < 1.2 ? 'text-red-500 animate-pulse' :
              isWorsening ? 'text-yellow-500' :
              'text-green-500'
            }`}>
              {isWorsening && newValue < 1.0 ? '⚠️ Liquidation Risk!' :
               isWorsening && newValue < 1.2 ? '⚠️ Low Health Factor' :
               isImproving ? '✓ Position Improving' :
               'No Change'}
            </div>
          )}
        </div>
      )}

      {/* Risk indicator legend */}
      {showLabels && (
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-health-safe" />
            <span>Safe (&gt;1.5)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-health-warning" />
            <span>Caution</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-health-danger" />
            <span>Risk (&lt;1.0)</span>
          </div>
        </div>
      )}
    </div>
  );
}
