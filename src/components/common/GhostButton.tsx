import React from 'react';
import { sound } from '@/services/sound';

interface GhostButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const GhostButton: React.FC<GhostButtonProps> = ({
  children,
  icon,
  size = 'md',
  fullWidth = false,
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl',
    md: 'px-4 py-2 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-2xl',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    sound.playClick();
    if (onClick) onClick(e);
  };

  return (
    <button
      className={`tactile-btn-ghost flex items-center justify-center gap-2 font-bold tracking-tight ${sizeClasses[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="material-symbols-outlined text-lg">{icon}</span>}
      {children}
    </button>
  );
};
