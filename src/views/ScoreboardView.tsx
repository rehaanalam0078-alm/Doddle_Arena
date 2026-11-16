import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { RoomState, ArtworkRecord } from '@/types/game';
import { PlayerAvatar } from '@/components/common/PlayerAvatar';
import { sound } from '@/services/sound';
import { DrawingCanvas } from '@/components/canvas/DrawingCanvas';

interface ScoreboardViewProps {
  room: RoomState;
  currentPlayerId: string;
  onVoteRematch: () => void;
  onReturnToLobby: () => void;
}

export const ScoreboardView: React.FC<ScoreboardViewProps> = ({
  room,
  currentPlayerId,
  onVoteRematch,
  onReturnToLobby,
}) => {
  const [selectedArtIndex, setSelectedArtIndex] = useState(0);
  const [copiedShare, setCopiedShare] = useState(false);

  // Trigger celebration confetti on mount
  useEffect(() => {
    sound.playCorrect();
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#7C3AED', '#FF6B6B', '#06B6D4', '#F59E0B'],
      });
    } catch (e) {}
  }, []);

  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  const first = sortedPlayers[0];
  const second = sortedPlayers[1];
  const third = sortedPlayers[2];

  const hasVotedRematch = room.rematchVotes?.includes(currentPlayerId) || false;
  const currentVotesCount = room.rematchVotes?.length || 0;
  const requiredVotes = Math.ceil(room.players.length / 2);

  const selectedArtwork = room.artworks[selectedArtIndex];

  const handleShareResults = async () => {
    sound.playClick();
    const summary = `🎨 Doodle Arena Match Complete!\n🏆 1st: ${first?.name || 'Player'} (${first?.score || 0} pts)\n🥈 2nd: ${second?.name || 'Player'} (${second?.score || 0} pts)\nPlay free at ${window.location.origin}`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch (e) {}
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8 text-center">
      {/* HEADER BANNER */}
      <div className="flex flex-col items-center gap-1">
        <span className="inline-block px-3.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-black text-xs uppercase tracking-widest shadow-sm">
          🏆 Victory Celebration
        </span>
        <h1 className="font-headline-xl text-3xl sm:text-5xl font-black text-on-surface tracking-tight mt-1">
          Final Match Scoreboard
        </h1>
        <p className="text-xs sm:text-sm text-outline font-medium">
          Match completed • {room.totalRounds} Rounds Played
        </p>
      </div>

      {/* 3D VICTORY PODIUM */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-2xl mx-auto w-full pt-8">
        {/* 2nd Place Pillar */}
        {second && (
          <div className="flex flex-col items-center animate-scaleUp" style={{ animationDelay: '0.1s' }}>
            <div className="relative mb-2">
              <PlayerAvatar
                style={second.avatar.style}
                hat={second.avatar.hat}
                color={second.avatar.color}
                size="lg"
              />
              <span className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-slate-300 text-on-surface font-black text-xs flex items-center justify-center border-2 border-white shadow">
                2
              </span>
            </div>
            <span className="font-bold text-xs sm:text-sm text-on-surface truncate max-w-[90px]">
              {second.name}
            </span>
            <span className="font-extrabold text-xs text-primary">{second.score} PTS</span>
            <div className="w-full h-32 sm:h-40 bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-3xl border-2 border-b-0 border-slate-300 shadow-sm flex items-center justify-center font-black text-2xl text-slate-400 mt-2">
              2
            </div>
          </div>
        )}

        {/* 1st Place Pillar (Winner) */}
        {first && (
          <div className="flex flex-col items-center animate-scaleUp z-10">
            <div className="relative mb-2">
              <span className="text-2xl sm:text-3xl absolute -top-6 left-1/2 -translate-x-1/2 filter drop-shadow">
                👑
              </span>
              <PlayerAvatar
                style={first.avatar.style}
                hat={first.avatar.hat}
                color={first.avatar.color}
                size="xl"
              />
              <span className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-amber-400 text-on-background font-black text-xs flex items-center justify-center border-2 border-white shadow-md">
                1
              </span>
            </div>
            <span className="font-black text-sm sm:text-base text-on-surface truncate max-w-[120px]">
              {first.name}
            </span>
            <span className="font-black text-sm text-amber-600">{first.score} PTS</span>
            <div className="w-full h-44 sm:h-56 bg-gradient-to-t from-amber-300 to-amber-200 rounded-t-3xl border-2 border-b-0 border-amber-400 shadow-md flex items-center justify-center font-black text-4xl text-amber-700/60 mt-2">
              1
            </div>
          </div>
        )}

        {/* 3rd Place Pillar */}
        {third && (
          <div className="flex flex-col items-center animate-scaleUp" style={{ animationDelay: '0.2s' }}>
            <div className="relative mb-2">
              <PlayerAvatar
                style={third.avatar.style}
                hat={third.avatar.hat}
                color={third.avatar.color}
                size="lg"
              />
              <span className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center border-2 border-white shadow">
                3
              </span>
            </div>
            <span className="font-bold text-xs sm:text-sm text-on-surface truncate max-w-[90px]">
              {third.name}
            </span>
            <span className="font-extrabold text-xs text-primary">{third.score} PTS</span>
            <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-amber-700/20 to-amber-700/10 rounded-t-3xl border-2 border-b-0 border-amber-700/30 shadow-sm flex items-center justify-center font-black text-2xl text-amber-800/40 mt-2">
              3
            </div>
          </div>
        )}
      </div>

      {/* FULL MATCH LEADERBOARD & ARTWORK GALLERY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        {/* Full Leaderboard Table (7 Cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-3xl p-6 tactile-card">
          <h3 className="font-headline-md text-lg font-bold text-on-surface mb-4">
            Match Standings
          </h3>
          <div className="space-y-2.5">
            {sortedPlayers.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline-variant"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-surface-container text-xs font-black flex items-center justify-center text-outline">
                    #{idx + 1}
                  </span>
                  <PlayerAvatar
                    style={p.avatar.style}
                    hat={p.avatar.hat}
                    color={p.avatar.color}
                    size="sm"
                  />
                  <div>
                    <span className="font-bold text-sm text-on-surface">{p.name}</span>
                    <span className="block text-[10px] text-outline">
                      +{p.score} Season XP
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-base text-primary tabular-nums">
                    {p.score}
                  </span>
                  <span className="block text-[10px] font-bold text-outline">PTS</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Artwork Gallery Showcase (5 Cols) */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-3xl p-6 tactile-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-headline-md text-lg font-bold text-on-surface">
                Match Art Gallery
              </h3>
              {room.artworks.length > 0 && (
                <span className="text-xs text-outline font-semibold">
                  {selectedArtIndex + 1} of {room.artworks.length}
                </span>
              )}
            </div>

            {selectedArtwork ? (
              <div className="flex flex-col gap-3">
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-outline-variant bg-white">
                  <DrawingCanvas
                    isInteractive={false}
                    strokes={selectedArtwork.strokes}
                  />
                </div>
                <div>
                  <h4 className="font-bold text-base text-on-surface">
                    "{selectedArtwork.word}"
                  </h4>
                  <p className="text-xs text-outline font-medium">
                    Sketched by {selectedArtwork.drawerName} in Round {selectedArtwork.round}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-outline text-xs">
                No artworks recorded for this match.
              </div>
            )}
          </div>

          {/* Gallery navigation */}
          {room.artworks.length > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-outline-variant mt-4">
              <button
                onClick={() =>
                  setSelectedArtIndex((i) => (i - 1 + room.artworks.length) % room.artworks.length)
                }
                className="tactile-btn-ghost px-3 py-1.5 rounded-xl text-xs font-bold"
              >
                ← Previous
              </button>
              <button
                onClick={() =>
                  setSelectedArtIndex((i) => (i + 1) % room.artworks.length)
                }
                className="tactile-btn-ghost px-3 py-1.5 rounded-xl text-xs font-bold"
              >
                Next Art →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ACTION DECK: REMATCH VOTING & LOBBY */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 tactile-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <h4 className="font-bold text-sm text-on-surface">Rematch Voting</h4>
          <p className="text-xs text-outline font-medium">
            {currentVotesCount} / {requiredVotes} votes required to launch rematch table.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleShareResults}
            className="px-4 py-3 tactile-btn-ghost rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">
              {copiedShare ? 'done' : 'share'}
            </span>
            <span>{copiedShare ? 'Copied Summary!' : 'Share Results'}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onReturnToLobby();
            }}
            className="px-5 py-3 tactile-btn-ghost rounded-xl text-xs font-bold"
          >
            Exit to Lobby
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onVoteRematch();
            }}
            disabled={hasVotedRematch}
            className={`px-8 py-3.5 rounded-xl text-sm font-bold transition-all ${
              hasVotedRematch
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold'
                : 'tactile-btn-primary'
            }`}
          >
            {hasVotedRematch ? '✓ Voted Rematch' : 'Vote Rematch ↻'}
          </button>
        </div>
      </div>
    </div>
  );
};
