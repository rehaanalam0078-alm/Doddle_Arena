import React, { useState } from 'react';
import { PlayerAvatar } from './PlayerAvatar';
import { sound } from '@/services/sound';
import { PlayerAvatar as IPlayerAvatar } from '@/types/game';

interface AppHeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onlineCount?: number;
  userAvatar: IPlayerAvatar;
  userName: string;
  userLevel: number;
  userXp: number;
  onOpenProfile: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentView,
  onNavigate,
  onlineCount = 14820,
  userAvatar,
  userName,
  userLevel,
  userXp,
  onOpenProfile,
  onOpenHelp,
  onOpenSettings,
}) => {
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const [lang, setLang] = useState('EN');

  const handleSoundToggle = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const navLinks = [
    { id: 'lobby', label: 'Lobby', icon: 'sports_esports' },
    { id: 'leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
    { id: 'rooms', label: 'Rooms', icon: 'grid_view' },
    { id: 'shop', label: 'Shop', icon: 'storefront' },
  ];

  return (
    <header className="flex justify-between items-center w-full px-4 sm:px-6 py-2.5 max-w-full bg-surface-container-lowest border-b-2 border-outline-variant shadow-sm z-40 sticky top-0">
      {/* Brand & Live Presence */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2.5 group cursor-pointer"
          onClick={() => onNavigate('lobby')}
        >
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm border-b-2 border-on-primary-fixed-variant group-hover:rotate-6 transition-transform">
            <span className="material-symbols-outlined text-2xl">edit</span>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-primary drop-shadow-sm leading-none font-headline-lg">
              Doodle Arena
            </span>
            <span className="text-[10px] sm:text-xs text-outline font-bold flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {onlineCount.toLocaleString()} ARTISTS ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Center Navigation Links */}
      <nav className="hidden md:flex items-center gap-6">
        {navLinks.map((link) => {
          const isActive = currentView === link.id;
          return (
            <button
              key={link.id}
              onClick={() => {
                sound.playClick();
                onNavigate(link.id);
              }}
              className={`font-bold text-sm flex items-center gap-1.5 pb-1 transition-all border-b-2 ${
                isActive
                  ? 'text-primary border-primary'
                  : 'text-on-surface-variant border-transparent hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{link.icon}</span>
              {link.label}
            </button>
          );
        })}
      </nav>

      {/* Trailing Icon Actions & Profile Level Badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Audio toggle */}
        <button
          aria-label="Toggle Sound"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors active:translate-y-0.5"
          onClick={handleSoundToggle}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          <span className="material-symbols-outlined text-xl">
            {isMuted ? 'volume_off' : 'volume_up'}
          </span>
        </button>

        {/* Language selector toggle */}
        <button
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs transition-colors active:translate-y-0.5"
          onClick={() => {
            sound.playClick();
            setLang((prev) => (prev === 'EN' ? 'ES' : prev === 'ES' ? 'FR' : 'EN'));
          }}
          title="Change Language"
        >
          <span className="material-symbols-outlined text-base">translate</span>
          <span>{lang}</span>
        </button>

        {/* Settings gear */}
        <button
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors active:translate-y-0.5"
          onClick={() => {
            sound.playClick();
            onOpenSettings();
          }}
          title="Game Settings"
        >
          <span className="material-symbols-outlined text-xl">settings</span>
        </button>

        {/* Help / Game Rules */}
        <button
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors active:translate-y-0.5"
          onClick={() => {
            sound.playClick();
            onOpenHelp();
          }}
          title="Game Rules & Help"
        >
          <span className="material-symbols-outlined text-xl">help</span>
        </button>

        {/* Player Profile & Avatar preview */}
        <div
          className="flex items-center gap-2 pl-2 sm:pl-3 sm:border-l-2 sm:border-outline-variant cursor-pointer group"
          onClick={() => {
            sound.playClick();
            onOpenProfile();
          }}
          title="View Player Profile"
        >
          <div className="relative">
            <PlayerAvatar
              style={userAvatar.style}
              hat={userAvatar.hat}
              color={userAvatar.color}
              size="md"
            />
            <span className="absolute -bottom-1 -right-1 bg-primary text-on-primary text-[9px] font-black px-1.5 py-0.2 rounded-full border border-surface-container-lowest">
              LV.{userLevel}
            </span>
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="font-bold text-xs text-on-surface leading-tight group-hover:text-primary transition-colors">
              {userName}
            </span>
            <span className="text-[10px] text-outline font-semibold">
              {userXp.toLocaleString()} XP
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
