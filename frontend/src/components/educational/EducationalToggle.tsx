'use client';

import { useEducationalMode } from '@/hooks/useEducationalMode';

interface EducationalToggleProps {
  size?: 'sm' | 'md' | 'lg';
}

export function EducationalToggle({ size = 'md' }: EducationalToggleProps) {
  const { isEnabled, toggleEducationalMode } = useEducationalMode();

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2',
  };

  return (
    <button
      onClick={toggleEducationalMode}
      className={`flex items-center ${sizeClasses[size]} rounded-lg font-medium transition-all duration-300 ${
        isEnabled
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 animate-pulse-slow'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
      }`}
      title={isEnabled ? 'Disable Educational Mode' : 'Enable Educational Mode'}
    >
      <span className={`transition-transform ${isEnabled ? 'animate-bounce-subtle' : ''}`}>
        {isEnabled ? '🎓' : '📖'}
      </span>
      <span>
        {isEnabled ? 'Learning' : 'Learn'}
      </span>
      {isEnabled && (
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
      )}
    </button>
  );
}

// Floating toggle for corner placement
export function EducationalFloatingToggle() {
  const { isEnabled, toggleEducationalMode } = useEducationalMode();

  return (
    <button
      onClick={toggleEducationalMode}
      className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
        isEnabled
          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white scale-110 shadow-purple-500/40'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105'
      }`}
      title={isEnabled ? 'Disable Educational Mode' : 'Enable Educational Mode'}
    >
      <span className={`text-2xl ${isEnabled ? 'animate-bounce-subtle' : ''}`}>
        {isEnabled ? '🎓' : '📚'}
      </span>
      
      {/* Ripple effect when enabled */}
      {isEnabled && (
        <>
          <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/30 to-pink-400/30 animate-pulse" />
        </>
      )}
    </button>
  );
}

// Header badge showing educational mode status
export function EducationalBadge() {
  const { isEnabled } = useEducationalMode();

  if (!isEnabled) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full text-xs font-medium text-purple-300 animate-fade-in">
      <span className="animate-bounce-subtle">🎓</span>
      <span>Learning Mode</span>
    </div>
  );
}
