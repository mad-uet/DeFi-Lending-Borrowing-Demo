'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  pulse?: boolean;
  ripple?: boolean;
}

export function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  pulse = false,
  ripple = true,
  className = '',
  disabled,
  ...props
}: AnimatedButtonProps) {
  const baseClasses = `
    relative overflow-hidden
    inline-flex items-center justify-center gap-2
    font-semibold rounded-lg
    transition-all duration-300
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-primary-500 to-primary-600 text-white
      hover:from-primary-400 hover:to-primary-500
      focus:ring-primary-500
      shadow-lg shadow-primary-500/25
      hover:shadow-xl hover:shadow-primary-500/30
      hover:-translate-y-0.5
      active:translate-y-0
    `,
    secondary: `
      bg-gray-700 text-gray-200
      hover:bg-gray-600 hover:text-white
      focus:ring-gray-500
      border border-gray-600
      hover:border-gray-500
    `,
    success: `
      bg-gradient-to-r from-green-500 to-emerald-600 text-white
      hover:from-green-400 hover:to-emerald-500
      focus:ring-green-500
      shadow-lg shadow-green-500/25
      hover:shadow-xl hover:shadow-green-500/30
      hover:-translate-y-0.5
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-rose-600 text-white
      hover:from-red-400 hover:to-rose-500
      focus:ring-red-500
      shadow-lg shadow-red-500/25
      hover:shadow-xl hover:shadow-red-500/30
      hover:-translate-y-0.5
    `,
    ghost: `
      bg-transparent text-gray-400
      hover:bg-gray-700/50 hover:text-white
      focus:ring-gray-500
    `,
  };

  const LoadingSpinner = () => (
    <svg 
      className="animate-spin h-4 w-4" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${pulse && !disabled ? 'animate-pulse-slow' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {/* Ripple effect background */}
      {ripple && (
        <span className="absolute inset-0 overflow-hidden rounded-lg">
          <span className="absolute inset-0 bg-white/10 scale-0 transition-transform duration-500 group-hover:scale-100 rounded-lg" />
        </span>
      )}
      
      {/* Content */}
      <span className="relative flex items-center gap-2">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </span>
    </button>
  );
}

// Icon-only button
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

export function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  tooltip,
  className = '',
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-400 shadow-lg',
    secondary: 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white',
    ghost: 'bg-transparent text-gray-400 hover:bg-gray-700/50 hover:text-white',
    danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300',
  };

  return (
    <button
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-lg
        inline-flex items-center justify-center
        transition-all duration-200
        hover:scale-110 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        group relative
        ${className}
      `}
      title={tooltip}
      {...props}
    >
      {children}
      
      {/* Tooltip */}
      {tooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {tooltip}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </button>
  );
}

// Floating Action Button
export function FloatingActionButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`
        fixed bottom-6 right-6 z-40
        w-14 h-14
        bg-gradient-to-br from-primary-500 to-primary-600
        text-white text-2xl
        rounded-full
        shadow-xl shadow-primary-500/30
        flex items-center justify-center
        transition-all duration-300
        hover:scale-110 hover:shadow-2xl hover:shadow-primary-500/40
        active:scale-95
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
