'use client';

import { useState } from 'react';
import { useEducationalMode, DEFI_CONCEPTS, DeFiConcept } from '@/hooks/useEducationalMode';

interface ConceptCardProps {
  conceptId: string;
  variant?: 'inline' | 'popup' | 'tooltip';
  showFullExplanation?: boolean;
}

export function ConceptCard({ conceptId, variant = 'inline', showFullExplanation = false }: ConceptCardProps) {
  const { isEnabled, showConceptCards } = useEducationalMode();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const concept = DEFI_CONCEPTS[conceptId];
  
  if (!concept || (!isEnabled && variant !== 'popup')) {
    return null;
  }

  if (variant === 'tooltip') {
    return (
      <span className="group relative inline-block cursor-help">
        <span className="underline decoration-dotted decoration-primary-400 text-primary-400">
          {concept.title}
        </span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-64">
          <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{concept.icon}</span>
              <span className="font-semibold">{concept.title}</span>
            </div>
            <p className="text-gray-300">{concept.shortDescription}</p>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      </span>
    );
  }

  const shouldShow = showConceptCards || variant === 'popup';

  if (!shouldShow) return null;

  return (
    <div className={`rounded-lg border transition-all duration-300 ${
      isExpanded ? 'bg-gradient-to-br from-primary-900/30 to-primary-800/30 border-primary-500/50' : 'bg-gray-800/50 border-gray-700/50 hover:border-primary-500/30'
    }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center gap-3 text-left"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center text-xl">
          {concept.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-100">{concept.title}</h4>
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary-500/20 text-primary-400 rounded">
              Learn
            </span>
          </div>
          <p className="text-sm text-gray-400 truncate">{concept.shortDescription}</p>
        </div>

        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 animate-slide-in-up">
          <p className="text-sm text-gray-300 leading-relaxed">
            {concept.fullExplanation}
          </p>

          {concept.formula && (
            <div className="p-2 bg-gray-900/50 rounded border border-gray-700">
              <div className="text-xs text-gray-500 mb-1">Formula:</div>
              <code className="text-sm text-primary-400 font-mono">{concept.formula}</code>
            </div>
          )}

          {concept.example && (
            <div className="p-2 bg-blue-900/20 rounded border border-blue-700/30">
              <div className="text-xs text-blue-400 mb-1">💡 Example:</div>
              <p className="text-sm text-blue-200">{concept.example}</p>
            </div>
          )}

          {concept.relatedConcepts && concept.relatedConcepts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-700/50">
              <span className="text-xs text-gray-500">Related:</span>
              {concept.relatedConcepts.map(relatedId => {
                const related = DEFI_CONCEPTS[relatedId];
                return related ? (
                  <span
                    key={relatedId}
                    className="px-2 py-0.5 text-xs bg-gray-700/50 text-gray-300 rounded hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    {related.icon} {related.title}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Inline concept highlight - shows term with tooltip
export function ConceptHighlight({ conceptId, children }: { conceptId: string; children?: React.ReactNode }) {
  const { isEnabled } = useEducationalMode();
  const concept = DEFI_CONCEPTS[conceptId];
  
  if (!isEnabled || !concept) {
    return <>{children || concept?.title}</>;
  }

  return (
    <ConceptCard conceptId={conceptId} variant="tooltip" />
  );
}

// Concept sidebar panel
export function ConceptsSidebar() {
  const { isEnabled, showConceptCards, toggleConceptCards } = useEducationalMode();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isEnabled) return null;

  const filteredConcepts = Object.values(DEFI_CONCEPTS).filter(concept =>
    concept.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    concept.shortDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 overflow-hidden animate-slide-in-right">
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-100 flex items-center gap-2">
            <span className="text-xl">📚</span>
            DeFi Concepts
          </h3>
          <button
            onClick={toggleConceptCards}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              showConceptCards 
                ? 'bg-primary-500/20 text-primary-400' 
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            {showConceptCards ? 'Cards On' : 'Cards Off'}
          </button>
        </div>
        
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search concepts..."
            className="w-full pl-8 pr-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
        {filteredConcepts.map(concept => (
          <ConceptCard key={concept.id} conceptId={concept.id} />
        ))}
        
        {filteredConcepts.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-4">
            No concepts found
          </p>
        )}
      </div>
    </div>
  );
}
