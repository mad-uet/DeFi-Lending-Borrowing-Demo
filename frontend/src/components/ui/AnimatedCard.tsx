'use client';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
  onClick?: () => void;
}

export function AnimatedCard({
  children,
  className = '',
  hover = true,
  glow = false,
  gradient = false,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        relative
        bg-white dark:bg-gray-800
        rounded-xl
        shadow-lg
        overflow-hidden
        transition-all duration-300
        ${hover ? 'hover:shadow-xl hover:-translate-y-1' : ''}
        ${glow ? 'ring-1 ring-primary-500/20 hover:ring-primary-500/40' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Gradient overlay */}
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none" />
      )}
      
      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  );
}

// Card with header
interface CardWithHeaderProps extends CardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function CardWithHeader({
  title,
  subtitle,
  icon,
  action,
  children,
  ...props
}: CardWithHeaderProps) {
  return (
    <AnimatedCard {...props}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500">
                {icon}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </AnimatedCard>
  );
}

// Stats card with animated value
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = 'primary',
}: StatsCardProps) {
  const colorClasses = {
    primary: 'from-primary-500/20 to-primary-600/20 text-primary-500',
    success: 'from-green-500/20 to-emerald-600/20 text-green-500',
    warning: 'from-yellow-500/20 to-amber-600/20 text-yellow-500',
    danger: 'from-red-500/20 to-rose-600/20 text-red-500',
  };

  return (
    <AnimatedCard className="p-4" hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white animate-count-up">
            {value}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-gray-500">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
            {icon}
          </div>
        )}
      </div>
    </AnimatedCard>
  );
}

// Loading card skeleton
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-800 rounded-xl p-4 animate-pulse ${className}`}>
      <div className="h-4 bg-gray-700 rounded w-1/3 mb-3" />
      <div className="h-8 bg-gray-700 rounded w-2/3 mb-2" />
      <div className="h-3 bg-gray-700 rounded w-1/2" />
    </div>
  );
}

// Expandable card
interface ExpandableCardProps extends CardProps {
  title: string;
  preview?: React.ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
}

export function ExpandableCard({
  title,
  preview,
  children,
  expanded = false,
  onToggle,
  ...props
}: ExpandableCardProps) {
  return (
    <AnimatedCard {...props} hover={false}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          {!expanded && preview && (
            <div className="text-sm text-gray-500 mt-1">{preview}</div>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-96' : 'max-h-0'}`}>
        <div className="p-4 pt-0 border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      </div>
    </AnimatedCard>
  );
}
