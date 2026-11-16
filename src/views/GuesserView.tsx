import React, { useState } from 'react';
import { RoomState, Stroke, ChatMessage } from '@/types/game';
import { PlayerCard } from '@/components/common/PlayerCard';
import { GameTimer } from '@/components/common/GameTimer';
import { DrawingCanvas } from '@/components/canvas/DrawingCanvas';
import { ChatMessageItem } from '@/components/common/ChatMessageItem';
import { sound } from '@/services/sound';

interface GuesserViewProps {
  room: RoomState;
  currentPlayerId: string;
  strokes: Stroke[];
  messages: ChatMessage[];
  onSubmitGuess: (guess: string) => void;
  onLikeArtwork: () => void;
  onLeaveGame: () => void;
}

export const GuesserView: React.FC<GuesserViewProps> = ({
  room,
  currentPlayerId,
  strokes,
  messages,
  onSubmitGuess,
  onLikeArtwork,
  onLeaveGame,
}) => {
  const [guessInput, setGuessInput] = useState('');
  const [zoomScale, setZoomScale] = useState(1);
  const [hasLiked, setHasLiked] = useState(false);

  const currentPlayer = room.players.find((p) => p.id === currentPlayerId);
  const hasGuessed = currentPlayer?.hasGuessed || false;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || hasGuessed) return;
    sound.playClick();
    onSubmitGuess(guessInput.trim());
    setGuessInput('');
  };

  const handleLike = () => {
    if (hasLiked) return;
    sound.playCorrect();
    setHasLiked(true);
    onLikeArtwork();
  };

  return (
    <div className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 py-4 flex flex-col gap-4 text-left">
      {/* TOP GUESSER HUD */}
      <div className="bg-surface-container-lowest rounded-2xl px-5 py-3 tactile-card flex flex-wrap items-center justify-between gap-4">
        {/* Left: Drawer Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-lg">edit</span>
            </span>
            <div>
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                Room #{room.code} • Round {room.currentRound}/{room.totalRounds}
              </span>
              <span className="font-extrabold text-sm sm:text-base text-on-surface">
                {room.drawerName || 'Artist'} is Drawing
              </span>
            </div>
          </div>
        </div>

        {/* Center: Authoritative Timer & Secret Clue Mask */}
        <div className="flex items-center gap-4 sm:gap-6">
          <GameTimer
            timerStart={room.timerStart}
            timerEnd={room.timerEnd}
            totalDurationSeconds={room.durationSeconds}
            size={56}
            strokeWidth={5}
          />

          {/* Masked Clue Letters */}
          <div className="bg-surface-container-low border-2 border-outline-variant px-5 py-2 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest">
              WORD CLUE ({room.letterCount} LETTERS)
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black text-primary tracking-widest leading-tight">
              {room.clue || '_ _ _ _ _'}
            </span>
            <span className="text-[11px] font-semibold text-outline">
              Category: {room.category || 'General'}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onLeaveGame();
            }}
            className="px-3.5 py-2 tactile-btn-secondary text-xs rounded-xl flex items-center gap-1"
            title="Leave Match"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Leave</span>
          </button>
        </div>
      </div>

      {/* THREE-COLUMN ARENA LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start flex-1">
        {/* COLUMN 1: LEFT PLAYER SCOREBOARD (3 Cols) */}
        <div className="lg:col-span-3 bg-surface-container-lowest rounded-3xl p-4 tactile-card flex flex-col gap-3 max-h-[750px] overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">leaderboard</span>
              Scoreboard ({room.players.length})
            </span>
            <span className="text-[10px] text-outline font-semibold">Rankings</span>
          </div>

          <div className="overflow-y-auto space-y-2 pr-1">
            {room.players.map((p) => (
              <PlayerCard
                key={p.id}
                player={p}
                isCurrentDrawer={p.id === room.currentDrawerId}
                isGuessed={p.hasGuessed}
              />
            ))}
          </div>
        </div>

        {/* COLUMN 2: CENTER MIRRORED CANVAS & GUESS INPUT (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          {/* Canvas Viewport */}
          <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden bg-white shadow-md border-2 border-outline-variant relative">
            <DrawingCanvas
              isInteractive={false}
              strokes={strokes}
              zoomScale={zoomScale}
            />

            {/* Overlaid Zoom & Like utility controls */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-surface-container-lowest/90 backdrop-blur-sm p-1.5 rounded-2xl border border-outline-variant shadow-sm">
              <button
                type="button"
                onClick={() => setZoomScale((z) => (z === 1 ? 1.3 : 1))}
                className="w-8 h-8 rounded-xl bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface text-sm font-bold"
                title="Toggle Zoom Canvas"
              >
                <span className="material-symbols-outlined text-base">
                  {zoomScale > 1 ? 'zoom_out' : 'zoom_in'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleLike}
                disabled={hasLiked}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  hasLiked
                    ? 'bg-rose-100 text-rose-600 font-extrabold'
                    : 'bg-surface-container hover:bg-rose-50 text-rose-600 active:scale-95'
                }`}
                title="Like Artwork"
              >
                <span className="material-symbols-outlined text-base fill-icon">
                  favorite
                </span>
                <span>{hasLiked ? 'Liked!' : 'Like'}</span>
              </button>
            </div>
          </div>

          {/* Correct Guess Banner OR Guess Input Field */}
          {hasGuessed ? (
            <div className="p-4 rounded-2xl bg-tertiary-fixed text-on-tertiary-fixed border-2 border-tertiary-fixed-dim shadow-sm flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-tertiary text-white flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-2xl">check_circle</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-on-surface">
                    You guessed the word!
                  </h4>
                  <p className="text-xs text-outline font-medium">
                    Sit back and enjoy watching other players guess.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-tertiary text-white rounded-xl text-xs font-black">
                SOLVED
              </span>
            </div>
          ) : (
            <form
              onSubmit={handleFormSubmit}
              className="bg-surface-container-lowest p-2 rounded-2xl tactile-card flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Type your guess here..."
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-low border-2 border-outline-variant rounded-xl font-bold text-sm text-on-surface outline-none focus:border-primary"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 tactile-btn-primary rounded-xl font-headline-md text-sm"
              >
                Guess →
              </button>
            </form>
          )}
        </div>

        {/* COLUMN 3: RIGHT GUESS CHAT FEED (3 Cols) */}
        <div className="lg:col-span-3 bg-surface-container-lowest rounded-3xl p-4 tactile-card flex flex-col justify-between h-[650px] lg:h-[750px]">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">chat</span>
              Live Guesses
            </span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-Time
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto py-2 space-y-1.5 text-left">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-outline text-xs">
                No guesses submitted yet. Be the first to solve!
              </div>
            ) : (
              messages.map((m) => <ChatMessageItem key={m.id} message={m} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
