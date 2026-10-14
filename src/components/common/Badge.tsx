import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'champagne' | 'outline';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  className = '',
  size = 'md'
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-colors';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const variantClasses = {
    primary: 'bg-indigo text-white',
    secondary: 'bg-navy text-white',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    champagne: 'bg-amber-50 text-amber-900 border border-champagne/40',
    outline: 'border border-gray-300 text-gray-700 bg-white'
  };

  return (
    <span className={`${baseClasses} ${sizeClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};
