'use client';

import { useState, useEffect, useCallback } from 'react';
import StepIndicator, { Step, StepStatus } from './StepIndicator';

export type TransactionPhase = 
  | 'idle' 
  | 'preparing' 
  | 'approving' 
  | 'confirming' 
  | 'executing' 
  | 'completed' 
  | 'error';

export interface TransactionStep {
  id: string;
  label: string;
  description: string;
  phase: TransactionPhase;
}

interface TransactionProgressProps {
  phase: TransactionPhase;
  steps?: TransactionStep[];
  txHash?: string;
  errorMessage?: string;
  onCancel?: () => void;
  showCancelButton?: boolean;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Default transaction steps
const DEFAULT_STEPS: TransactionStep[] = [
  {
    id: 'prepare',
    label: 'Prepare',
    description: 'Validating transaction',
    phase: 'preparing',
  },
  {
    id: 'approve',
    label: 'Approve',
    description: 'Token approval',
    phase: 'approving',
  },
  {
    id: 'confirm',
    label: 'Confirm',
    description: 'Waiting for signature',
    phase: 'confirming',
  },
  {
    id: 'execute',
    label: 'Execute',
    description: 'Processing on-chain',
    phase: 'executing',
  },
  {
    id: 'complete',
    label: 'Complete',
    description: 'Transaction finished',
    phase: 'completed',
  },
];

// Simple 3-step flow for transactions without approval
const SIMPLE_STEPS: TransactionStep[] = [
  {
    id: 'confirm',
    label: 'Confirm',
    description: 'Confirm in wallet',
    phase: 'confirming',
  },
  {
    id: 'execute',
    label: 'Processing',
    description: 'On-chain execution',
    phase: 'executing',
  },
  {
    id: 'complete',
    label: 'Complete',
    description: 'Transaction finished',
    phase: 'completed',
  },
];

const phaseOrder: TransactionPhase[] = [
  'idle',
  'preparing',
  'approving',
  'confirming',
  'executing',
  'completed',
];

function getPhaseIndex(phase: TransactionPhase): number {
  if (phase === 'error') return -1;
  return phaseOrder.indexOf(phase);
}

function getStepStatus(step: TransactionStep, currentPhase: TransactionPhase): StepStatus {
  if (currentPhase === 'error') {
    // Find which step the error occurred at
    const currentIndex = phaseOrder.indexOf(step.phase);
    const errorIndex = phaseOrder.length - 1; // Assume error at last active step
    if (currentIndex < errorIndex) return 'completed';
    return 'error';
  }

  const stepPhaseIndex = getPhaseIndex(step.phase);
  const currentPhaseIndex = getPhaseIndex(currentPhase);

  if (stepPhaseIndex < currentPhaseIndex) return 'completed';
  if (stepPhaseIndex === currentPhaseIndex) return 'active';
  return 'pending';
}

export default function TransactionProgress({
  phase,
  steps = DEFAULT_STEPS,
  txHash,
  errorMessage,
  onCancel,
  showCancelButton = true,
  orientation = 'horizontal',
  size = 'md',
  className = '',
}: TransactionProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(() => Date.now());

  // Track elapsed time during transaction
  useEffect(() => {
    if (phase === 'idle' || phase === 'completed' || phase === 'error') {
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, startTime]);

  const canCancel = phase === 'preparing' || phase === 'approving' || phase === 'confirming';

  const indicatorSteps: Step[] = steps.map(step => ({
    id: step.id,
    label: step.label,
    description: step.description,
    status: getStepStatus(step, phase),
  }));

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  const getStatusMessage = () => {
    switch (phase) {
      case 'idle':
        return 'Ready to start';
      case 'preparing':
        return 'Preparing transaction...';
      case 'approving':
        return 'Please approve token spending in your wallet';
      case 'confirming':
        return 'Please confirm the transaction in your wallet';
      case 'executing':
        return 'Transaction submitted, waiting for confirmation...';
      case 'completed':
        return 'Transaction completed successfully!';
      case 'error':
        return errorMessage || 'Transaction failed';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (phase) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'idle':
        return 'text-gray-500 dark:text-gray-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <StepIndicator
        steps={indicatorSteps}
        orientation={orientation}
        size={size}
        showDescriptions={orientation === 'vertical'}
        animated
      />

      {/* Status message and timer */}
      <div className="flex flex-col items-center gap-2">
        <div className={`text-center ${getStatusColor()} transition-colors duration-200`}>
          {phase !== 'idle' && phase !== 'completed' && phase !== 'error' && (
            <span className="inline-flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
              </span>
              {getStatusMessage()}
            </span>
          )}
          {(phase === 'completed' || phase === 'error') && getStatusMessage()}
        </div>

        {/* Elapsed time */}
        {phase !== 'idle' && phase !== 'completed' && phase !== 'error' && elapsedTime > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Elapsed: {formatTime(elapsedTime)}
          </div>
        )}

        {/* Transaction hash */}
        {txHash && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Tx:</span>
            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">
              {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(txHash)}
              className="text-blue-500 hover:text-blue-600 transition-colors"
              title="Copy transaction hash"
            >
              📋
            </button>
          </div>
        )}

        {/* Cancel button */}
        {showCancelButton && canCancel && onCancel && (
          <button
            onClick={onCancel}
            className="mt-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-red-300 dark:hover:border-red-700 transition-colors"
          >
            Cancel Transaction
          </button>
        )}
      </div>
    </div>
  );
}

// Hook for managing transaction progress state
export function useTransactionProgress() {
  const [phase, setPhase] = useState<TransactionPhase>('idle');
  const [txHash, setTxHash] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const reset = useCallback(() => {
    setPhase('idle');
    setTxHash(undefined);
    setErrorMessage(undefined);
  }, []);

  const startTransaction = useCallback(() => {
    setPhase('preparing');
    setTxHash(undefined);
    setErrorMessage(undefined);
  }, []);

  const setApproving = useCallback(() => {
    setPhase('approving');
  }, []);

  const setConfirming = useCallback(() => {
    setPhase('confirming');
  }, []);

  const setExecuting = useCallback((hash?: string) => {
    setPhase('executing');
    if (hash) setTxHash(hash);
  }, []);

  const complete = useCallback((hash?: string) => {
    setPhase('completed');
    if (hash) setTxHash(hash);
  }, []);

  const fail = useCallback((message: string) => {
    setPhase('error');
    setErrorMessage(message);
  }, []);

  return {
    phase,
    txHash,
    errorMessage,
    isInProgress: phase !== 'idle' && phase !== 'completed' && phase !== 'error',
    isComplete: phase === 'completed',
    isError: phase === 'error',
    reset,
    startTransaction,
    setApproving,
    setConfirming,
    setExecuting,
    complete,
    fail,
  };
}

// Pre-configured for simple transactions (no approval)
export function SimpleTransactionProgress(props: Omit<TransactionProgressProps, 'steps'>) {
  return <TransactionProgress {...props} steps={SIMPLE_STEPS} />;
}

// Pre-configured for approval + execute transactions
export function ApprovalTransactionProgress(props: Omit<TransactionProgressProps, 'steps'>) {
  const APPROVAL_STEPS: TransactionStep[] = [
    {
      id: 'approve',
      label: 'Approve',
      description: 'Approve token spending',
      phase: 'approving',
    },
    {
      id: 'confirm',
      label: 'Confirm',
      description: 'Confirm transaction',
      phase: 'confirming',
    },
    {
      id: 'execute',
      label: 'Execute',
      description: 'Processing',
      phase: 'executing',
    },
    {
      id: 'complete',
      label: 'Complete',
      description: 'Done',
      phase: 'completed',
    },
  ];
  
  return <TransactionProgress {...props} steps={APPROVAL_STEPS} />;
}
