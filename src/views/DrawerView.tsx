import React from 'react';
import { RoomState, Stroke, DrawingTool, ChatMessage } from '@/types/game';
import { PlayerCard } from '@/components/common/PlayerCard';
import { GameTimer } from '@/components/common/GameTimer';
import { DrawingCanvas } from '@/components/canvas/DrawingCanvas';
import { DrawingToolbar } from '@/components/canvas/DrawingToolbar';
import { ChatMessageItem } from '@/components/common/ChatMessageItem';
import { VoiceChatBar } from '@/components/voice/VoiceChatBar';
import { sound } from '@/services/sound';

interface DrawerViewProps {
  room: RoomState;
  currentPlayerId: string;
  strokes: Stroke[];
  messages: ChatMessage[];
  currentTool: DrawingTool;
  currentColor: string;
  currentBrushSize: number;
  onSelectTool: (tool: DrawingTool) => void;
  onSelectColor: (color: string) => void;
  onSelectBrushSize: (size: number) => void;
  onEmitStroke: (stroke: Stroke) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onLeaveGame: () => void;
}

export const DrawerView: React.FC<DrawerViewProps> = ({
  room,
  currentPlayerId,
  strokes,
  messages,
  currentTool,
  currentColor,
  currentBrushSize,
  onSelectTool,
  onSelectColor,
  onSelectBrushSize,
  onEmitStroke,
  onUndo,
  onRedo,
  onClear,
  onLeaveGame,
}) => {
  return (
    <div className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 py-4 flex flex-col gap-4 text-left">
      {/* TOP GAMEPLAY HUD */}
      <div className="bg-surface-container-lowest rounded-2xl px-5 py-3 tactile-card flex flex-wrap items-center justify-between gap-4">
        {/* Left: Room & Round Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-lg">brush</span>
            </span>
            <div>
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                Room #{room.code}
              </span>
              <span className="font-extrabold text-sm sm:text-base text-on-surface">
                Round {room.currentRound} of {room.totalRounds}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Authoritative Timer & Secret Word Banner */}
        <div className="flex items-center gap-4 sm:gap-6">
          <GameTimer
            timerStart={room.timerStart}
            timerEnd={room.timerEnd}
            totalDurationSeconds={room.durationSeconds}
            size={56}
            strokeWidth={5}
          />

          {/* Drawer Secret Word Reveal Banner */}
          <div className="bg-primary-fixed/30 border-2 border-primary px-5 py-2 rounded-2xl flex flex-col items-center shadow-sm">
            <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">
              YOUR SECRET WORD
            </span>
            <span className="font-headline-lg text-lg sm:text-2xl font-black text-primary tracking-wide leading-tight">
              {room.secretWord || 'SECRET'}
            </span>
            <span className="text-[11px] font-bold text-outline">
              {room.category} • +{room.difficultyPoints} PTS
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

      {/* PRIVATE ROOM VOICE CHAT BAR */}
      <VoiceChatBar room={room} currentPlayerId={currentPlayerId} />

      {/* THREE-COLUMN ARENA LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start flex-1">
        {/* COLUMN 1: LEFT PLAYER LEADERBOARD (3 Cols on Desktop) */}
        <div className="lg:col-span-3 bg-surface-container-lowest rounded-3xl p-4 tactile-card flex flex-col gap-3 max-h-[750px] overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">leaderboard</span>
              Scoreboard ({room.players.length})
            </span>
            <span className="text-[10px] text-outline font-semibold">Live Rank</span>
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

        {/* COLUMN 2: CENTER DRAWING CANVAS & TOOLBAR (6 Cols on Desktop) */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          {/* Canvas Viewport */}
          <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden bg-white shadow-md border-2 border-outline-variant">
            <DrawingCanvas
              isInteractive={true}
              currentTool={currentTool}
              currentColor={currentColor}
              currentBrushSize={currentBrushSize}
              strokes={strokes}
              onEmitStroke={onEmitStroke}
            />
          </div>

          {/* Docked Tactile Toolbelt */}
          <DrawingToolbar
            currentTool={currentTool}
            onSelectTool={onSelectTool}
            currentColor={currentColor}
            onSelectColor={onSelectColor}
            currentBrushSize={currentBrushSize}
            onSelectBrushSize={onSelectBrushSize}
            onUndo={onUndo}
            onRedo={onRedo}
            onClear={onClear}
            canUndo={strokes.length > 0}
            canRedo={true}
          />
        </div>

        {/* COLUMN 3: RIGHT LIVE GUESS STREAM & DRAWER EXPLAiNER (3 Cols on Desktop) */}
        <div className="lg:col-span-3 bg-surface-container-lowest rounded-3xl p-4 tactile-card flex flex-col justify-between h-[650px] lg:h-[750px]">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">chat</span>
              Live Guesses
            </span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Stream
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto py-2 space-y-1.5 text-left">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-outline text-xs">
                No guesses yet. Draw clues to help players solve!
              </div>
            ) : (
              messages.map((m) => <ChatMessageItem key={m.id} message={m} />)
            )}
          </div>

          {/* Locked Chat Notice for Drawer */}
          <div className="pt-3 border-t border-outline-variant">
            <div className="p-3 rounded-2xl bg-surface-container text-outline text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">lock</span>
              <span>You are the Drawer! Watch players guess your sketches.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
