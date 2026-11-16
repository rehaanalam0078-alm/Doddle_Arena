import React, { useState, useEffect } from 'react';
import { RoomState, Stroke, ChatMessage } from '@/types/game';
import { PlayerAvatar } from '@/components/common/PlayerAvatar';
import { GameTimer } from '@/components/common/GameTimer';
import { DrawingCanvas } from '@/components/canvas/DrawingCanvas';
import { ChatMessageItem } from '@/components/common/ChatMessageItem';
import { sound } from '@/services/sound';

interface SpectatorViewProps {
  room: RoomState;
  strokes: Stroke[];
  messages: ChatMessage[];
  onSendSpectatorReaction: (reaction: string) => void;
  onSendChatMessage: (text: string) => void;
  onLeaveGame: () => void;
}

export const SpectatorView: React.FC<SpectatorViewProps> = ({
  room,
  strokes,
  messages,
  onSendSpectatorReaction,
  onSendChatMessage,
  onLeaveGame,
}) => {
  const [showSpoilerWord, setShowSpoilerWord] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [activeBursts, setActiveBursts] = useState<{ id: string; emoji: string }[]>([]);

  // Keyboard shortcuts: T (Theater), C (Cheer), M (Mute), S (Spoiler)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const key = e.key.toUpperCase();
      if (key === 'T') {
        setIsTheaterMode((prev) => !prev);
      } else if (key === 'C') {
        handleTriggerCheer('🔥');
      } else if (key === 'M') {
        sound.toggleMute();
      } else if (key === 'S') {
        setShowSpoilerWord((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTriggerCheer = (emoji: string) => {
    sound.playClick();
    onSendSpectatorReaction(emoji);

    // Floating burst animation
    const id = `burst_${Date.now()}_${Math.random()}`;
    setActiveBursts((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setActiveBursts((prev) => prev.filter((b) => b.id !== id));
    }, 2000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sound.playClick();
    onSendChatMessage(`[Spectator] ${chatInput.trim()}`);
    setChatInput('');
  };

  const currentDrawer = room.players.find((p) => p.id === room.currentDrawerId);

  return (
    <div
      className={`flex-1 max-w-[1700px] w-full mx-auto px-3 sm:px-6 py-4 flex flex-col gap-4 text-left ${
        isTheaterMode ? 'fixed inset-0 z-50 bg-surface-dim p-4 overflow-y-auto' : ''
      }`}
    >
      {/* TOP SPECTATOR STREAM HUD */}
      <div className="bg-surface-container-lowest rounded-2xl px-5 py-3 tactile-card flex flex-wrap items-center justify-between gap-4">
        {/* Left: Stream Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-tertiary text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">tv</span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-on-surface">
                  Spectator Live Stream: #{room.code}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                  LIVE
                </span>
              </div>
              <span className="text-xs text-outline font-medium">
                Round {room.currentRound} of {room.totalRounds} • Drawer: {currentDrawer?.name || 'Artist'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Authoritative Timer & Secret Word Spoiler Shield */}
        <div className="flex items-center gap-4 sm:gap-6">
          <GameTimer
            timerStart={room.timerStart}
            timerEnd={room.timerEnd}
            totalDurationSeconds={room.durationSeconds}
            size={56}
            strokeWidth={5}
          />

          {/* Secret Word Spoiler Mask Card */}
          <div className="bg-surface-container-low border-2 border-outline-variant px-4 py-1.5 rounded-2xl flex items-center gap-3">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
                SECRET WORD (SPOILER)
              </span>
              <span className="font-headline-md text-base sm:text-lg font-black text-primary tracking-wide">
                {showSpoilerWord ? room.secretWord || room.clue : '••••••••'}
              </span>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                setShowSpoilerWord((s) => !s);
              }}
              className="tactile-btn-ghost px-2.5 py-1.5 rounded-xl text-xs font-bold text-primary flex items-center gap-1"
              title="Toggle Word Visibility (HotKey: S)"
            >
              <span className="material-symbols-outlined text-sm">
                {showSpoilerWord ? 'visibility_off' : 'visibility'}
              </span>
              <span>{showSpoilerWord ? 'Hide' : 'Reveal'}</span>
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Theater Mode Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              setIsTheaterMode((t) => !t);
            }}
            className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface text-sm font-bold"
            title="Toggle Theater Mode (Key: T)"
          >
            <span className="material-symbols-outlined text-xl">
              {isTheaterMode ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>

          {/* Grid Overlay Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              setShowGrid((g) => !g);
            }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
              showGrid
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
            }`}
            title="Toggle Alignment Grid"
          >
            <span className="material-symbols-outlined text-xl">grid_4x4</span>
          </button>

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

      {/* THREE-COLUMN SPECTATOR ARENA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start flex-1">
        {/* COLUMN 1: LEFT MATCHUP ROSTER & PREDICTOR (3 Cols) */}
        <div className="lg:col-span-3 bg-surface-container-lowest rounded-3xl p-4 tactile-card flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">sports_score</span>
              Live Matchup
            </span>
            <span className="text-[10px] text-outline font-semibold">Table Intel</span>
          </div>

          {/* Player Scores List */}
          <div className="space-y-2">
            {room.players.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-surface-container text-[11px] font-black text-outline flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <PlayerAvatar
                    style={p.avatar.style}
                    hat={p.avatar.hat}
                    color={p.avatar.color}
                    size="sm"
                    showDrawingBadge={p.id === room.currentDrawerId}
                    isGuessed={p.hasGuessed}
                  />
                  <div>
                    <span className="text-xs font-bold text-on-surface truncate max-w-[100px] block">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-outline">
                      {p.id === room.currentDrawerId ? 'Active Drawer' : p.hasGuessed ? 'Solved' : 'Guessing'}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs font-black text-primary">
                  {p.score} PTS
                </span>
              </div>
            ))}
          </div>

          {/* Match Prediction Poll */}
          <div className="mt-2 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant text-left">
            <span className="text-[10px] font-black uppercase tracking-wider text-outline block mb-1">
              Viewer Prediction
            </span>
            <span className="text-xs font-bold text-on-surface block mb-2">
              Will the room solve this drawing?
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTriggerCheer('🔥')}
                className="py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold transition-all"
              >
                Yes (84%)
              </button>
              <button
                type="button"
                onClick={() => handleTriggerCheer('🤯')}
                className="py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-bold transition-all"
              >
                No (16%)
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 2: CENTER LIVE CANVAS FEED (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col gap-3 relative">
          {/* Canvas Viewport */}
          <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden bg-white shadow-md border-2 border-outline-variant relative">
            <DrawingCanvas
              isInteractive={false}
              strokes={strokes}
              showGrid={showGrid}
            />

            {/* Floating Burst Reaction Animations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-end justify-center pb-8 gap-4">
              {activeBursts.map((b) => (
                <span
                  key={b.id}
                  className="text-4xl animate-bounce filter drop-shadow-lg"
                >
                  {b.emoji}
                </span>
              ))}
            </div>
          </div>

          {/* Floating Cheer Reaction Toolbar */}
          <div className="bg-surface-container-lowest p-2.5 rounded-2xl tactile-card flex items-center justify-between">
            <span className="text-xs font-bold text-outline">Cheer Reactions:</span>
            <div className="flex items-center gap-2">
              {['🔥', '👏', '🎨', '🤯', '😂', '⚡'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleTriggerCheer(emoji)}
                  className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-container-high text-lg flex items-center justify-center transition-transform active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 3: RIGHT SPECTATOR CHAT & INTEL (3 Cols) */}
        <div className="lg:col-span-3 bg-surface-container-lowest rounded-3xl p-4 tactile-card flex flex-col justify-between h-[650px] lg:h-[750px]">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">forum</span>
              Spectator Lounge
            </span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Feed
            </span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto py-2 space-y-1.5 text-left">
            {messages.map((m) => (
              <ChatMessageItem key={m.id} message={m} />
            ))}
          </div>

          {/* Chat input */}
          <form onSubmit={handleSendChat} className="pt-2 border-t border-outline-variant flex items-center gap-2">
            <input
              type="text"
              placeholder="Chat with spectators..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-xs outline-none focus:border-primary font-medium"
            />
            <button
              type="submit"
              className="px-3.5 py-2.5 tactile-btn-primary rounded-xl text-xs font-bold"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
