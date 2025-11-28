'use client';

import { useState } from 'react';
import { useEducationalMode } from '@/hooks/useEducationalMode';
import { DEFI_CONCEPTS } from '@/hooks/useEducationalMode';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  highlight?: string; // Element ID to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  conceptId?: string; // Related DeFi concept
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  icon: string;
  steps: TutorialStep[];
}

const TUTORIALS: Tutorial[] = [
  {
    id: 'supply-basics',
    title: 'How to Supply Assets',
    description: 'Learn how to deposit assets and start earning interest',
    icon: '💰',
    steps: [
      {
        id: 'step-1',
        title: 'Choose an Asset',
        content: 'Select an asset from the "Supply Assets" section. Each asset has different APY (interest rates) and risk profiles.',
        conceptId: 'supplyApy',
      },
      {
        id: 'step-2',
        title: 'Enter Amount',
        content: 'Enter the amount you want to supply. Your wallet balance shows the maximum you can deposit.',
      },
      {
        id: 'step-3',
        title: 'Review Transaction',
        content: 'Check the transaction preview to see how your health factor and rewards will change.',
        conceptId: 'healthFactor',
      },
      {
        id: 'step-4',
        title: 'Confirm & Earn',
        content: 'Confirm the transaction in your wallet. Once complete, you\'ll start earning interest automatically!',
      },
    ],
  },
  {
    id: 'borrow-basics',
    title: 'How to Borrow Safely',
    description: 'Understand borrowing and avoid liquidation',
    icon: '🏦',
    steps: [
      {
        id: 'step-1',
        title: 'Supply Collateral First',
        content: 'Before borrowing, you need to supply assets as collateral. Your collateral secures your loan.',
        conceptId: 'collateral',
      },
      {
        id: 'step-2',
        title: 'Check Borrowing Power',
        content: 'Your borrowing power depends on your collateral value and LTV ratio. Don\'t borrow the maximum!',
        conceptId: 'ltv',
      },
      {
        id: 'step-3',
        title: 'Monitor Health Factor',
        content: 'Keep your health factor above 1.5 for safety. Below 1.0, you risk liquidation.',
        conceptId: 'healthFactor',
      },
      {
        id: 'step-4',
        title: 'Understand Risks',
        content: 'If asset prices change, your health factor changes. Always maintain a safety buffer!',
        conceptId: 'liquidation',
      },
    ],
  },
  {
    id: 'health-factor',
    title: 'Understanding Health Factor',
    description: 'Master the key metric that keeps you safe',
    icon: '💓',
    steps: [
      {
        id: 'step-1',
        title: 'What is Health Factor?',
        content: 'Health Factor measures how safe your position is. It\'s calculated from your collateral value and debt.',
        conceptId: 'healthFactor',
      },
      {
        id: 'step-2',
        title: 'Safe Zone (>1.5)',
        content: 'Above 1.5, your position is healthy. You have a comfortable buffer before any risk.',
      },
      {
        id: 'step-3',
        title: 'Warning Zone (1.0-1.5)',
        content: 'Between 1.0 and 1.5, be careful! Price movements could push you toward liquidation.',
      },
      {
        id: 'step-4',
        title: 'Danger Zone (<1.0)',
        content: 'Below 1.0, liquidation can happen! Add collateral or repay debt immediately.',
        conceptId: 'liquidation',
      },
    ],
  },
];

// Interactive flow diagram showing the lending/borrowing cycle - Flipped S-Shape Roadmap
export function FlowDiagram() {
  const { isEnabled } = useEducationalMode();
  const [activeStep, setActiveStep] = useState<number | null>(null);

  if (!isEnabled) return null;

  const steps = [
    { id: 1, label: 'Deposit', icon: '💰', description: 'Supply assets as collateral', color: 'from-green-500 to-emerald-500' },
    { id: 2, label: 'Collateralize', icon: '🔒', description: 'Assets are locked in protocol', color: 'from-blue-500 to-cyan-500' },
    { id: 3, label: 'Borrow', icon: '📤', description: 'Borrow against your collateral', color: 'from-purple-500 to-pink-500' },
    { id: 4, label: 'Use Funds', icon: '💼', description: 'Use borrowed assets freely', color: 'from-orange-500 to-amber-500' },
    { id: 5, label: 'Repay', icon: '💵', description: 'Return borrowed amount + interest', color: 'from-teal-500 to-green-500' },
    { id: 6, label: 'Withdraw', icon: '📥', description: 'Reclaim your collateral', color: 'from-indigo-500 to-blue-500' },
  ];

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 animate-fade-in">
      <h3 className="text-lg font-semibold text-gray-100 mb-6 flex items-center gap-2">
        <span className="text-xl">🔄</span>
        Lending & Borrowing Cycle
      </h3>
      
      {/* S-Shaped Roadmap */}
      <div className="relative px-4">
        {/* Row 1: Steps 1-3 (left to right) */}
        <div className="flex items-center justify-between mb-2">
          {steps.slice(0, 3).map((step, index) => (
            <div key={step.id} className="flex items-center">
              <StepNode 
                step={step} 
                isActive={activeStep === step.id}
                onMouseEnter={() => setActiveStep(step.id)}
                onMouseLeave={() => setActiveStep(null)}
              />
              {index < 2 && (
                <div className="w-12 h-0.5 bg-gradient-to-r from-gray-600 to-gray-500 mx-1">
                  <div className="w-full h-full bg-gradient-to-r from-primary-500/50 to-primary-400/50 animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Connector: Step 3 down to Step 4 */}
        <div className="flex justify-end pr-8 my-1">
          <div className="w-0.5 h-8 bg-gradient-to-b from-gray-500 to-gray-600">
            <div className="w-full h-full bg-gradient-to-b from-primary-400/50 to-primary-500/50 animate-pulse" />
          </div>
        </div>

        {/* Row 2: Steps 4-6 (right to left) */}
        <div className="flex items-center justify-between flex-row-reverse mt-2">
          {steps.slice(3, 6).map((step, index) => (
            <div key={step.id} className="flex items-center flex-row-reverse">
              <StepNode 
                step={step} 
                isActive={activeStep === step.id}
                onMouseEnter={() => setActiveStep(step.id)}
                onMouseLeave={() => setActiveStep(null)}
              />
              {index < 2 && (
                <div className="w-12 h-0.5 bg-gradient-to-l from-gray-600 to-gray-500 mx-1">
                  <div className="w-full h-full bg-gradient-to-l from-primary-500/50 to-primary-400/50 animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Return arrow from Step 6 back to Step 1 */}
        <div className="flex items-center justify-center mt-4 pt-2 border-t border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-primary-300">Cycle repeats - continuous earning!</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Node Component for the roadmap
interface StepNodeProps {
  step: { id: number; label: string; icon: string; description: string; color: string };
  isActive: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function StepNode({ step, isActive, onMouseEnter, onMouseLeave }: StepNodeProps) {
  return (
    <div className="relative">
      <button
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`relative flex flex-col items-center p-3 rounded-xl transition-all duration-300 min-w-[70px] ${
          isActive
            ? `bg-gradient-to-br ${step.color} text-white scale-110 shadow-lg shadow-primary-500/20`
            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:scale-105'
        }`}
      >
        <div className="absolute -top-1 -left-1 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center text-xs font-bold text-primary-400 border border-gray-600">
          {step.id}
        </div>
        <span className="text-2xl mb-1">{step.icon}</span>
        <span className="text-xs font-medium text-center leading-tight">{step.label}</span>
      </button>
      
      {isActive && (
        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-40 p-2 bg-gray-900 rounded-lg text-center text-xs text-gray-300 shadow-xl z-50 border border-gray-700">
          {step.description}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 border-l border-t border-gray-700 rotate-45" />
        </div>
      )}
    </div>
  );
}

// Step-by-step tutorial modal
interface StepByStepTutorialProps {
  tutorialId: string;
  onClose: () => void;
}

export function StepByStepTutorial({ tutorialId, onClose }: StepByStepTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const tutorial = TUTORIALS.find(t => t.id === tutorialId);

  if (!tutorial) return null;

  const step = tutorial.steps[currentStep];
  const concept = step.conceptId ? DEFI_CONCEPTS[step.conceptId] : null;
  const isLastStep = currentStep === tutorial.steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{tutorial.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-white">{tutorial.title}</h2>
                <p className="text-primary-100 text-sm">Step {currentStep + 1} of {tutorial.steps.length}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-700">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tutorial.steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">{step.title}</h3>
          <p className="text-gray-300 leading-relaxed mb-4">{step.content}</p>

          {concept && (
            <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{concept.icon}</span>
                <span className="font-medium text-gray-200">{concept.title}</span>
              </div>
              <p className="text-sm text-gray-400">{concept.shortDescription}</p>
              {concept.formula && (
                <code className="block mt-2 text-xs text-primary-400 font-mono">
                  {concept.formula}
                </code>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Back
          </button>
          
          <div className="flex gap-1.5">
            {tutorial.steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStep ? 'bg-primary-500 w-6' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              if (isLastStep) {
                onClose();
              } else {
                setCurrentStep(s => s + 1);
              }
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isLastStep
                ? 'bg-green-500 hover:bg-green-400 text-white'
                : 'bg-primary-500 hover:bg-primary-400 text-white'
            }`}
          >
            {isLastStep ? 'Complete ✓' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Tutorial selection panel
export function TutorialPanel() {
  const { isEnabled, currentTutorial, startTutorial, endTutorial } = useEducationalMode();
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<string | null>(null);

  if (!isEnabled) return null;

  const handleStartTutorial = (tutorialId: string) => {
    setSelectedTutorial(tutorialId);
    setShowTutorial(true);
    startTutorial(tutorialId);
  };

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    setSelectedTutorial(null);
    endTutorial();
  };

  return (
    <>
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 overflow-hidden animate-fade-in">
        <div className="p-4 border-b border-gray-700/50">
          <h3 className="font-semibold text-gray-100 flex items-center gap-2">
            <span className="text-xl">🎯</span>
            Interactive Tutorials
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Step-by-step guides to master DeFi concepts
          </p>
        </div>

        <div className="p-3 space-y-2">
          {TUTORIALS.map(tutorial => (
            <button
              key={tutorial.id}
              onClick={() => handleStartTutorial(tutorial.id)}
              className="w-full p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 border border-gray-700/50 hover:border-primary-500/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl group-hover:scale-110 transition-transform">{tutorial.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-200 group-hover:text-white transition-colors">
                    {tutorial.title}
                  </h4>
                  <p className="text-xs text-gray-500">{tutorial.description}</p>
                  <p className="text-xs text-primary-400 mt-1">
                    {tutorial.steps.length} steps
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {showTutorial && selectedTutorial && (
        <StepByStepTutorial tutorialId={selectedTutorial} onClose={handleCloseTutorial} />
      )}
    </>
  );
}
