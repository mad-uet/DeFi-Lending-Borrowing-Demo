'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface EducationalModeState {
  isEnabled: boolean;
  currentTutorial: string | null;
  highlightedElement: string | null;
  showConceptCards: boolean;
}

interface EducationalModeContextType extends EducationalModeState {
  toggleEducationalMode: () => void;
  enableEducationalMode: () => void;
  disableEducationalMode: () => void;
  startTutorial: (tutorialId: string) => void;
  endTutorial: () => void;
  highlightElement: (elementId: string | null) => void;
  toggleConceptCards: () => void;
}

const EducationalModeContext = createContext<EducationalModeContextType | null>(null);

export function EducationalModeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EducationalModeState>({
    isEnabled: false,
    currentTutorial: null,
    highlightedElement: null,
    showConceptCards: true,
  });

  const toggleEducationalMode = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
  }, []);

  const enableEducationalMode = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: true }));
  }, []);

  const disableEducationalMode = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isEnabled: false,
      currentTutorial: null,
      highlightedElement: null,
    }));
  }, []);

  const startTutorial = useCallback((tutorialId: string) => {
    setState(prev => ({ ...prev, currentTutorial: tutorialId }));
  }, []);

  const endTutorial = useCallback(() => {
    setState(prev => ({ ...prev, currentTutorial: null, highlightedElement: null }));
  }, []);

  const highlightElement = useCallback((elementId: string | null) => {
    setState(prev => ({ ...prev, highlightedElement: elementId }));
  }, []);

  const toggleConceptCards = useCallback(() => {
    setState(prev => ({ ...prev, showConceptCards: !prev.showConceptCards }));
  }, []);

  return (
    <EducationalModeContext.Provider
      value={{
        ...state,
        toggleEducationalMode,
        enableEducationalMode,
        disableEducationalMode,
        startTutorial,
        endTutorial,
        highlightElement,
        toggleConceptCards,
      }}
    >
      {children}
    </EducationalModeContext.Provider>
  );
}

export function useEducationalMode() {
  const context = useContext(EducationalModeContext);
  if (!context) {
    throw new Error('useEducationalMode must be used within an EducationalModeProvider');
  }
  return context;
}

// DeFi Concept definitions
export interface DeFiConcept {
  id: string;
  title: string;
  shortDescription: string;
  fullExplanation: string;
  formula?: string;
  example?: string;
  icon: string;
  relatedConcepts?: string[];
}

export const DEFI_CONCEPTS: Record<string, DeFiConcept> = {
  collateral: {
    id: 'collateral',
    title: 'Collateral',
    shortDescription: 'Assets you deposit to secure a loan',
    fullExplanation: 'Collateral is an asset that a borrower pledges to a lender as security for a loan. If the borrower fails to repay, the lender can seize the collateral. In DeFi, collateral is typically cryptocurrency that you deposit into a smart contract.',
    example: 'If you deposit 10 ETH as collateral, you can borrow up to a certain percentage of its value in stablecoins.',
    icon: '🏦',
    relatedConcepts: ['ltv', 'healthFactor'],
  },
  ltv: {
    id: 'ltv',
    title: 'Loan-to-Value (LTV)',
    shortDescription: 'Ratio of loan amount to collateral value',
    fullExplanation: 'LTV represents the percentage of your collateral value that you can borrow. A 75% LTV means you can borrow up to 75% of your collateral value. Higher LTV = more borrowing power but higher risk.',
    formula: 'LTV = (Borrowed Amount / Collateral Value) × 100%',
    example: 'With $1000 in collateral and 75% LTV, you can borrow up to $750.',
    icon: '📊',
    relatedConcepts: ['collateral', 'healthFactor', 'liquidation'],
  },
  healthFactor: {
    id: 'healthFactor',
    title: 'Health Factor',
    shortDescription: 'Safety indicator for your position',
    fullExplanation: 'Health Factor measures how close your position is to liquidation. A value above 1.0 means you\'re safe. Below 1.0, your position can be liquidated. Higher health factor = safer position.',
    formula: 'Health Factor = (Collateral × Liquidation Threshold) / Debt',
    example: 'Health Factor of 2.0 means your collateral is worth twice the minimum required amount.',
    icon: '💓',
    relatedConcepts: ['liquidation', 'collateral', 'ltv'],
  },
  liquidation: {
    id: 'liquidation',
    title: 'Liquidation',
    shortDescription: 'When collateral is seized to repay debt',
    fullExplanation: 'Liquidation occurs when your Health Factor drops below 1.0. Other users (liquidators) can repay part of your debt and receive your collateral at a discount. This protects the protocol from bad debt.',
    example: 'If ETH price drops significantly, your collateral value decreases, potentially triggering liquidation.',
    icon: '⚠️',
    relatedConcepts: ['healthFactor', 'collateral', 'liquidationThreshold'],
  },
  liquidationThreshold: {
    id: 'liquidationThreshold',
    title: 'Liquidation Threshold',
    shortDescription: 'Maximum LTV before liquidation',
    fullExplanation: 'The liquidation threshold is the maximum LTV ratio at which a position can be liquidated. If your LTV exceeds this threshold, liquidators can seize your collateral.',
    formula: 'Position at risk when: LTV > Liquidation Threshold',
    example: 'With an 80% liquidation threshold and 75% LTV, you have a 5% buffer before liquidation risk.',
    icon: '🚨',
    relatedConcepts: ['liquidation', 'ltv', 'healthFactor'],
  },
  supplyApy: {
    id: 'supplyApy',
    title: 'Supply APY',
    shortDescription: 'Interest earned on deposits',
    fullExplanation: 'Supply APY (Annual Percentage Yield) is the interest rate you earn by depositing assets into the lending pool. It\'s calculated annually but accrues continuously based on borrowing demand.',
    formula: 'Earnings = Principal × (1 + APY)^time - Principal',
    example: '10% APY on $1000 = ~$100 earned over one year.',
    icon: '📈',
    relatedConcepts: ['borrowApy', 'utilizationRate'],
  },
  borrowApy: {
    id: 'borrowApy',
    title: 'Borrow APY',
    shortDescription: 'Interest paid on borrowed assets',
    fullExplanation: 'Borrow APY is the interest rate you pay when borrowing assets. It\'s typically higher than Supply APY. The rate increases as more of the pool is borrowed (higher utilization).',
    formula: 'Interest Owed = Borrowed Amount × (1 + APY)^time - Borrowed Amount',
    example: 'Borrowing $1000 at 15% APY costs ~$150 in interest per year.',
    icon: '📉',
    relatedConcepts: ['supplyApy', 'utilizationRate'],
  },
  utilizationRate: {
    id: 'utilizationRate',
    title: 'Utilization Rate',
    shortDescription: 'Percentage of pool being borrowed',
    fullExplanation: 'Utilization rate shows how much of the deposited assets are currently being borrowed. Higher utilization leads to higher interest rates for both suppliers and borrowers.',
    formula: 'Utilization = Total Borrowed / Total Supplied × 100%',
    example: 'If $800K is borrowed from a pool of $1M, utilization is 80%.',
    icon: '⚡',
    relatedConcepts: ['supplyApy', 'borrowApy'],
  },
};
