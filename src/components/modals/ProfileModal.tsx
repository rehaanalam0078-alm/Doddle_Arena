import React from 'react';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { PlayerAvatar as IPlayerAvatar } from '@/types/game';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatar: IPlayerAvatar;
  name: string;
  level: number;
  xp: number;
  elo: number;
  rankTier: string;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  avatar,
  name,
  level,
  xp,
  elo,
  rankTier,
}) => {
  if (!isOpen) return null;

  const nextLevelXp = Math.pow(level, 2) * 100;
  const currentLevelBaseXp = Math.pow(level - 1, 2) * 100;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((xp - currentLevelBaseXp) / (nextLevelXp - currentLevelBaseXp)) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 tactile-card max-w-md w-full flex flex-col gap-6 text-center animate-scaleUp">
        <div className="flex items-center justify-between border-b-2 border-outline-variant pb-3">
          <h2 className="font-headline-md text-xl font-bold text-on-surface">
            Doodler Dossier
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Profile Avatar Showcase */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative avatar-halo-active rounded-2xl p-1">
            <PlayerAvatar
              style={avatar.style}
              hat={avatar.hat}
              color={avatar.color}
              size="xl"
            />
            <span className="absolute -bottom-2 -right-2 bg-primary text-white text-xs font-black px-2 py-0.5 rounded-full shadow-md border-2 border-white">
              LV.{level}
            </span>
          </div>

          <div>
            <h3 className="font-headline-md text-2xl font-black text-on-surface">{name}</h3>
            <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs uppercase tracking-wider">
              {rankTier} • {elo} ELO
            </span>
          </div>
        </div>

        {/* XP Level Progress Bar */}
        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant text-left">
          <div className="flex items-center justify-between text-xs font-bold text-on-surface mb-1.5">
            <span>Level {level} Progress</span>
            <span className="text-outline">
              {xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
            </span>
          </div>
          <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Career Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant">
            <span className="block font-headline-md text-lg font-black text-primary">35</span>
            <span className="text-[10px] font-bold text-outline uppercase">Matches</span>
          </div>
          <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant">
            <span className="block font-headline-md text-lg font-black text-emerald-600">
              62.8%
            </span>
            <span className="text-[10px] font-bold text-outline uppercase">Win Rate</span>
          </div>
          <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant">
            <span className="block font-headline-md text-lg font-black text-amber-600">8</span>
            <span className="text-[10px] font-bold text-outline uppercase">Masterpieces</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 tactile-btn-primary rounded-xl text-xs font-bold"
        >
          Close Dossier
        </button>
      </div>
    </div>
  );
};
