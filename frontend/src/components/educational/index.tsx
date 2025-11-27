'use client';

import { useEducationalMode } from '@/hooks/useEducationalMode';
import { EducationalToggle, EducationalBadge } from './EducationalToggle';
import { TutorialPanel, FlowDiagram } from './FlowDiagram';
import { ConceptsSidebar } from './ConceptCard';

// Main educational panel that combines all components
export function EducationalPanel() {
  const { isEnabled } = useEducationalMode();

  if (!isEnabled) return null;

  return (
    <div className="space-y-4 animate-slide-in-right">
      <FlowDiagram />
      <TutorialPanel />
      <ConceptsSidebar />
    </div>
  );
}

// Export all educational components
export { EducationalToggle, EducationalBadge } from './EducationalToggle';
export { ConceptCard, ConceptHighlight, ConceptsSidebar } from './ConceptCard';
export { FlowDiagram, TutorialPanel, StepByStepTutorial } from './FlowDiagram';
