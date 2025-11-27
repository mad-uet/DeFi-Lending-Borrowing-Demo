'use client';

import { useEffect, useState } from 'react';

export type StepStatus = 'pending' | 'active' | 'completed' | 'error' | 'skipped';

export interface Step {
  id: string;
  label: string;
  description?: string;
  status: StepStatus;
  icon?: React.ReactNode;
}

interface StepIndicatorProps {
  steps: Step[];
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showDescriptions?: boolean;
  animated?: boolean;
  className?: string;
}

// Animated checkmark SVG
function AnimatedCheckmark({ size = 24 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className="animate-checkmark"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="currentColor"
        className="text-green-500"
      />
      <path
        d="M8 12l2.5 2.5L16 9"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-check-path"
        style={{
          strokeDasharray: 20,
          strokeDashoffset: 0,
          animation: 'checkmark-draw 0.3s ease-out forwards',
        }}
      />
    </svg>
  );
}

// Animated spinner
function StepSpinner({ size = 24 }: { size?: number }) {
  return (
    <div 
      className="relative"
      style={{ width: size, height: size }}
    >
      <div 
        className="absolute inset-0 border-2 border-blue-200 rounded-full"
      />
      <div 
        className="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full animate-spin"
      />
      <div 
        className="absolute inset-0 flex items-center justify-center"
      >
        <div 
          className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"
        />
      </div>
    </div>
  );
}

// Error X icon
function ErrorIcon({ size = 24 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="currentColor"
        className="text-red-500"
      />
      <path
        d="M15 9l-6 6M9 9l6 6"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Skipped icon (dash)
function SkippedIcon({ size = 24 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="currentColor"
        className="text-gray-400"
      />
      <path
        d="M8 12h8"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Pending dot
function PendingDot({ size = 24 }: { size?: number }) {
  return (
    <div 
      className="flex items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
      style={{ width: size, height: size }}
    >
      <div 
        className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"
      />
    </div>
  );
}

const sizeConfig = {
  sm: { icon: 20, text: 'text-xs', gap: 'gap-1', connector: 'h-0.5 w-8' },
  md: { icon: 28, text: 'text-sm', gap: 'gap-2', connector: 'h-0.5 w-12' },
  lg: { icon: 36, text: 'text-base', gap: 'gap-3', connector: 'h-1 w-16' },
};

export default function StepIndicator({
  steps,
  orientation = 'horizontal',
  size = 'md',
  showDescriptions = false,
  animated = true,
  className = '',
}: StepIndicatorProps) {
  const config = sizeConfig[size];
  const [animatedSteps, setAnimatedSteps] = useState<Set<string>>(new Set());

  // Track when steps become completed for animation
  useEffect(() => {
    if (animated) {
      steps.forEach(step => {
        if (step.status === 'completed' && !animatedSteps.has(step.id)) {
          setAnimatedSteps(prev => new Set([...prev, step.id]));
        }
      });
    }
  }, [steps, animated, animatedSteps]);

  const renderIcon = (step: Step) => {
    const iconSize = config.icon;
    const isNewlyCompleted = animated && animatedSteps.has(step.id);

    if (step.icon && step.status === 'pending') {
      return <div style={{ width: iconSize, height: iconSize }}>{step.icon}</div>;
    }

    switch (step.status) {
      case 'completed':
        return (
          <div className={isNewlyCompleted ? 'animate-bounce-once' : ''}>
            <AnimatedCheckmark size={iconSize} />
          </div>
        );
      case 'active':
        return <StepSpinner size={iconSize} />;
      case 'error':
        return <ErrorIcon size={iconSize} />;
      case 'skipped':
        return <SkippedIcon size={iconSize} />;
      default:
        return <PendingDot size={iconSize} />;
    }
  };

  const getConnectorColor = (currentIndex: number) => {
    const nextStep = steps[currentIndex + 1];
    const currentStep = steps[currentIndex];
    
    if (currentStep.status === 'completed' && nextStep?.status !== 'pending') {
      return 'bg-green-500';
    }
    if (currentStep.status === 'active') {
      return 'bg-gradient-to-r from-blue-500 to-gray-300 animate-pulse';
    }
    if (currentStep.status === 'error') {
      return 'bg-red-300';
    }
    return 'bg-gray-300 dark:bg-gray-600';
  };

  const getTextColor = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'active':
        return 'text-blue-600 dark:text-blue-400 font-medium';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'skipped':
        return 'text-gray-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  if (orientation === 'vertical') {
    return (
      <div className={`flex flex-col ${config.gap} ${className}`}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start">
            <div className="flex flex-col items-center">
              {renderIcon(step)}
              {index < steps.length - 1 && (
                <div 
                  className={`w-0.5 h-8 mt-1 mb-1 transition-colors duration-300 ${getConnectorColor(index)}`}
                />
              )}
            </div>
            <div className={`ml-3 ${showDescriptions ? 'pb-6' : 'pb-2'}`}>
              <div className={`${config.text} ${getTextColor(step.status)} transition-colors duration-200`}>
                {step.label}
              </div>
              {showDescriptions && step.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {step.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Horizontal orientation
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1 last:flex-none">
          <div className={`flex flex-col items-center ${config.gap}`}>
            {renderIcon(step)}
            <div className={`${config.text} ${getTextColor(step.status)} text-center transition-colors duration-200 whitespace-nowrap`}>
              {step.label}
            </div>
            {showDescriptions && step.description && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[100px]">
                {step.description}
              </div>
            )}
          </div>
          {index < steps.length - 1 && (
            <div 
              className={`flex-1 ${config.connector} mx-2 rounded-full transition-colors duration-300 ${getConnectorColor(index)}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Compact step indicator for inline use
export function CompactStepIndicator({ 
  currentStep, 
  totalSteps,
  label,
  className = ''
}: { 
  currentStep: number; 
  totalSteps: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i < currentStep 
                ? 'bg-green-500' 
                : i === currentStep 
                  ? 'bg-blue-500 animate-pulse scale-125' 
                  : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
      {label && (
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      )}
    </div>
  );
}
