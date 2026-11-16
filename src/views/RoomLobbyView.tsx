import React, { useState } from 'react';
import { RoomState, Player } from '@/types/game';
import { PlayerCard } from '@/components/common/PlayerCard';
import { ChatMessageItem } from '@/components/common/ChatMessageItem';
import { VoiceChatBar } from '@/components/voice/VoiceChatBar';
import { sound } from '@/services/sound';

interface RoomLobbyViewProps {
  room: RoomState;
  currentPlayerId: string;
  onSetReady: (isReady: boolean) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onUpdateSettings: (settings: any) => void;
  onSendMessage: (text: string) => void;
  onOpenInvite: () => void;
  onOpenWordlistEditor: () => void;
}

export const RoomLobbyView: React.FC<RoomLobbyViewProps> = ({
  room,
  currentPlayerId,
  onSetReady,
  onStartGame,
  onLeaveRoom,
  onUpdateSettings,
  onSendMessage,
  onOpenInvite,
  onOpenWordlistEditor,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const currentPlayer = room.players.find((p) => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost || currentPlayerId === room.hostId;
  const isReady = currentPlayer?.isReady || false;

  const handleCopyCode = async () => {
    sound.playClick();
    try {
      await navigator.clipboard.writeText(room.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {}
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sound.playClick();
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const handleSendQuickReaction = (reaction: string) => {
    sound.playClick();
    onSendMessage(reaction);
  };

  const emptySlotsCount = Math.max(0, room.settings.maxPlayers - room.players.length);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 text-left">
      {/* ROOM HEADER & ACTIONS */}
      <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 tactile-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-3xl">sports_esports</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-lg text-2xl sm:text-3xl font-black text-on-surface">
                Room #{room.code}
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed border border-primary">
                {room.settings.isPrivate ? 'PRIVATE TABLE' : 'PUBLIC ARENA'}
              </span>
            </div>
            <p className="text-xs text-outline font-medium mt-0.5">
              Host: {room.players.find((p) => p.isHost)?.name || 'Game Master'} • {room.players.length}/{room.settings.maxPlayers} Players Joined
            </p>
          </div>
        </div>

        {/* Copy, Invite & Leave buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleCopyCode}
            className="flex-1 sm:flex-initial px-4 py-2.5 tactile-btn-ghost rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            title="Copy Code"
          >
            <span className="material-symbols-outlined text-base">
              {copiedCode ? 'done' : 'content_copy'}
            </span>
            <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
          </button>

          <button
            onClick={onOpenInvite}
            className="flex-1 sm:flex-initial px-4 py-2.5 tactile-btn-tertiary rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">share</span>
            <span>Share Link</span>
          </button>

          <button
            onClick={onLeaveRoom}
            className="px-3.5 py-2.5 tactile-btn-secondary rounded-xl text-xs font-bold flex items-center gap-1"
            title="Leave Room"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>

      {/* PRIVATE ROOM VOICE CHAT BAR (Rendered only when enabled in private rooms) */}
      <VoiceChatBar room={room} currentPlayerId={currentPlayerId} />

      {/* MAIN TWO-COLUMN LOBBY ARENA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: PLAYER ROSTER GRID (7 Cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-3xl p-6 tactile-card flex flex-col gap-5">
          <div className="flex items-center justify-between border-b-2 border-outline-variant pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">groups</span>
              <h2 className="font-headline-md text-lg font-bold text-on-surface">
                Doodlers in Lobby ({room.players.length})
              </h2>
            </div>
            <span className="text-xs text-outline font-semibold">
              Min. 2 Players Required
            </span>
          </div>

          {/* Player Cards List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {room.players.map((p) => (
              <PlayerCard
                key={p.id}
                player={p}
                isInLobby={true}
                isCurrentDrawer={false}
              />
            ))}

            {/* Empty Slots */}
            {Array.from({ length: Math.min(4, emptySlotsCount) }).map((_, idx) => (
              <div
                key={`empty_${idx}`}
                onClick={onOpenInvite}
                className="p-3.5 rounded-2xl border-2 border-dashed border-outline-variant flex items-center justify-center gap-2 text-outline hover:text-primary hover:border-primary cursor-pointer transition-all bg-surface-container-low/50"
              >
                <span className="material-symbols-outlined text-xl">person_add</span>
                <span className="text-xs font-bold">Invite Friend</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: HOST SETTINGS & LIVE CHAT (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Room Settings Card */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 tactile-card flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between border-b-2 border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">tune</span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">
                  Match Settings
                </h3>
              </div>
              {!isHost && (
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider bg-surface-container px-2 py-0.5 rounded">
                  Host Controlled
                </span>
              )}
            </div>

            {/* Rounds Selector */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-on-surface mb-1.5">
                <span>Rounds</span>
                <span>{room.settings.rounds} Rounds</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[2, 3, 5, 8].map((r) => (
                  <button
                    key={r}
                    disabled={!isHost}
                    onClick={() => onUpdateSettings({ rounds: r })}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      room.settings.rounds === r
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant hover:bg-surface-container-high disabled:opacity-60'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Draw Time Selector */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-on-surface mb-1.5">
                <span>Draw Clock</span>
                <span>{room.settings.drawTimeSeconds} Seconds</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {([60, 80, 100, 120] as const).map((t) => (
                  <button
                    key={t}
                    disabled={!isHost}
                    onClick={() => onUpdateSettings({ drawTimeSeconds: t })}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      room.settings.drawTimeSeconds === t
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant hover:bg-surface-container-high disabled:opacity-60'
                    }`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selector */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-on-surface mb-1.5">
                <span>Difficulty</span>
                <span className="uppercase font-extrabold text-primary">
                  {room.settings.difficulty || 'medium'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    disabled={!isHost}
                    onClick={() => onUpdateSettings({ difficulty: diff })}
                    className={`py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                      (room.settings.difficulty || 'medium').toLowerCase() === diff
                        ? 'bg-secondary text-white border-secondary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant hover:bg-surface-container-high disabled:opacity-60'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Communication Toggle (Private Rooms Only) */}
            {room.settings.isPrivate && (
              <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-lg">mic</span>
                  <div>
                    <span className="block text-xs font-bold text-on-surface">Voice Chat</span>
                    <span className="text-[10px] text-outline font-medium">
                      {isHost ? 'Toggle voice for room' : 'Host managed'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!isHost}
                  onClick={() =>
                    onUpdateSettings({
                      voiceChatEnabled: !room.settings.voiceChatEnabled,
                    })
                  }
                  className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                    room.settings.voiceChatEnabled
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-surface-container-high text-outline border-outline-variant disabled:opacity-60'
                  }`}
                >
                  {room.settings.voiceChatEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            )}

            {/* Wordpack & Edit Pack trigger */}
            <div className="pt-2 border-t border-outline-variant flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-on-surface">Wordpack</span>
                <span className="text-[11px] text-outline font-medium">
                  {room.settings.wordPackId.toUpperCase()} • 120 Words
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenWordlistEditor}
                className="tactile-btn-ghost px-3 py-1.5 rounded-xl text-xs font-bold text-primary flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">edit_note</span>
                <span>Custom Pack</span>
              </button>
            </div>
          </div>

          {/* Lobby Chat Stream */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 tactile-card flex flex-col justify-between h-[320px]">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">chat</span>
                Lobby Chat
              </span>
              <span className="text-[10px] text-outline font-semibold">Live Room Feed</span>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto py-2 space-y-1.5 text-left">
              {room.players.length > 0 && (
                <ChatMessageItem
                  message={{
                    id: 'welcome',
                    playerName: 'System',
                    text: `Welcome to Room #${room.code}! Get ready to sketch!`,
                    type: 'system',
                    timestamp: Date.now(),
                  }}
                />
              )}
            </div>

            {/* Quick Reactions Bar */}
            <div className="flex items-center gap-1.5 py-1.5 border-t border-outline-variant">
              {['👍', '❤️', '🔥', '😂', '🤯'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSendQuickReaction(emoji)}
                  className="px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs transition-transform active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Send Input */}
            <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Say hello in lobby..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant text-xs outline-none focus:border-primary font-medium"
              />
              <button
                type="submit"
                className="px-3.5 py-2 tactile-btn-primary rounded-xl text-xs font-bold"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR: READY & START GAME */}
      <div className="bg-surface-container-lowest rounded-3xl p-5 tactile-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary font-bold">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
          </div>
          <div>
            <h4 className="font-bold text-sm text-on-surface">
              {isReady ? "You are READY to play!" : "Click Ready when you're prepared."}
            </h4>
            <p className="text-xs text-outline font-medium">
              {isHost
                ? 'As Host, you can start as soon as doodlers are ready.'
                : 'Waiting for Host to launch the game countdown.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Ready Button */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onSetReady(!isReady);
            }}
            className={`flex-1 sm:flex-initial px-6 py-3.5 rounded-xl font-bold text-sm transition-all ${
              isReady
                ? 'tactile-btn-ghost text-emerald-700 border-emerald-400'
                : 'tactile-btn-tertiary text-white'
            }`}
          >
            {isReady ? '✓ Cancel Ready' : "I'm Ready!"}
          </button>

          {/* Start Game Button (Host Only) */}
          {isHost ? (
            <button
              type="button"
              onClick={() => {
                sound.playRoundStart();
                onStartGame();
              }}
              disabled={room.players.length < 1}
              className="flex-1 sm:flex-initial px-8 py-3.5 tactile-btn-primary rounded-xl font-headline-md text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">play_arrow</span>
              <span>START GAME</span>
            </button>
          ) : (
            <div className="px-5 py-3 rounded-xl bg-surface-container text-xs font-bold text-outline">
              Waiting for Host...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
