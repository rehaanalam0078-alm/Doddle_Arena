import React from 'react';
import { Player } from '@/types/game';
import { PlayerAvatar } from './PlayerAvatar';

interface PlayerCardProps {
  player: Player;
  isCurrentDrawer?: boolean;
  isGuessed?: boolean;
  isInLobby?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentDrawer = false,
  isGuessed = false,
  isInLobby = false,
}) => {
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="w-6 h-6 rounded-full bg-amber-400 text-on-surface font-black text-xs flex items-center justify-center shadow-sm border border-amber-300">
            1
          </span>
        );
      case 2:
        return (
          <span className="w-6 h-6 rounded-full bg-slate-300 text-on-surface font-black text-xs flex items-center justify-center shadow-sm border border-slate-200">
            2
          </span>
        );
      case 3:
        return (
          <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-sm border border-amber-600">
            3
          </span>
        );
      default:
        return (
          <span className="w-6 h-6 rounded-full bg-surface-container-high text-outline font-bold text-xs flex items-center justify-center">
            {rank}
          </span>
        );
    }
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
        isCurrentDrawer
          ? 'bg-primary-fixed/40 border-primary shadow-[0_4px_16px_-2px_rgba(124,58,237,0.25)]'
          : isGuessed
          ? 'bg-emerald-50 border-emerald-300'
          : 'bg-surface-container-lowest border-outline-variant hover:bg-surface-container-low'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Rank indicator */}
        {!isInLobby && getRankBadge(player.rank)}

        {/* Avatar */}
        <div className={`relative ${isCurrentDrawer ? 'avatar-halo-drawer rounded-2xl' : ''}`}>
          <PlayerAvatar
            style={player.avatar.style}
            hat={player.avatar.hat}
            color={player.avatar.color}
            size="md"
            showDrawingBadge={isCurrentDrawer}
            isGuessed={isGuessed}
          />
        </div>

        {/* Player Info */}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-on-surface leading-tight truncate max-w-[110px]">
              {player.name}
            </span>
            {player.isHost && (
              <span
                className="material-symbols-outlined text-amber-500 text-sm fill-icon"
                title="Room Host"
              >
                crown
              </span>
            )}
          </div>

          {/* Subtext: Status or Drawer */}
          {isInLobby ? (
            <span
              className={`text-xs font-bold ${
                player.isReady ? 'text-emerald-600' : 'text-outline'
              }`}
            >
              {player.isReady ? 'Ready' : 'Not Ready'}
            </span>
          ) : isCurrentDrawer ? (
            <span className="text-xs font-extrabold text-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
              Drawing
            </span>
          ) : isGuessed ? (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              Guessed! (+{player.score})
            </span>
          ) : (
            <span className="text-xs font-medium text-outline">Guessing...</span>
          )}
        </div>
      </div>

      {/* Score or Ready Pill */}
      <div>
        {isInLobby ? (
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
              player.isReady
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-surface-container text-outline'
            }`}
          >
            {player.isReady ? 'READY' : 'WAITING'}
          </span>
        ) : (
          <div className="text-right">
            <span className="font-black text-base text-on-surface tabular-nums">
              {player.score}
            </span>
            <span className="block text-[10px] font-bold text-outline leading-none">
              PTS
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
