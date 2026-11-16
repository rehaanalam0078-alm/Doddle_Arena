import React from 'react';
import { AvatarStyle, AvatarHat } from '@/types/game';

interface PlayerAvatarProps {
  style?: AvatarStyle;
  hat?: AvatarHat;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showDrawingBadge?: boolean;
  isGuessed?: boolean;
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  style = 'cat',
  hat = 'none',
  color = '#7C3AED',
  size = 'md',
  showDrawingBadge = false,
  isGuessed = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-32 h-32 sm:w-36 sm:h-36',
  };

  const getFaceEmoji = (s: AvatarStyle) => {
    switch (s) {
      case 'cat':
        return '🐱';
      case 'fox':
        return '🦊';
      case 'robot':
        return '🤖';
      case 'monkey':
        return '🐵';
      case 'panda':
        return '🐼';
      case 'bear':
        return '🐻';
      default:
        return '🎨';
    }
  };

  const getHatEmoji = (h: AvatarHat) => {
    switch (h) {
      case 'beret':
        return '🎨';
      case 'headphones':
        return '🎧';
      case 'crown':
        return '👑';
      case 'cap':
        return '🧢';
      case 'sunglasses':
        return '🕶️';
      default:
        return null;
    }
  };

  const hatEmoji = getHatEmoji(hat);

  return (
    <div
      className={`relative rounded-2xl flex items-center justify-center border-2 border-outline-variant shadow-sm transition-transform duration-200 select-none ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: color }}
    >
      {/* Face Character */}
      <span className="text-2xl sm:text-3xl leading-none filter drop-shadow-sm">
        {getFaceEmoji(style)}
      </span>

      {/* Hat Overlay */}
      {hatEmoji && (
        <span
          className="absolute -top-2 -right-1 text-base sm:text-lg leading-none filter drop-shadow-md transform -rotate-12"
          title={`Hat: ${hat}`}
        >
          {hatEmoji}
        </span>
      )}

      {/* Active Drawing Pencil Badge */}
      {showDrawingBadge && (
        <div
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md border-2 border-surface-container-lowest animate-bounce"
          title="Currently Drawing"
        >
          <span className="material-symbols-outlined text-xs">brush</span>
        </div>
      )}

      {/* Guessed Checkmark Badge */}
      {isGuessed && (
        <div
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border-2 border-surface-container-lowest"
          title="Guessed correctly!"
        >
          <span className="material-symbols-outlined text-xs font-black">check</span>
        </div>
      )}
    </div>
  );
};
