import React, { useEffect, useState } from 'react';
import { RoomState } from '@/types/game';
import { voiceService, VoiceState } from '@/services/voice';
import { sound } from '@/services/sound';

interface VoiceChatBarProps {
  room: RoomState;
  currentPlayerId: string;
}

export const VoiceChatBar: React.FC<VoiceChatBarProps> = ({ room, currentPlayerId }) => {
  const [voiceState, setVoiceState] = useState<VoiceState>(voiceService.getState());
  const [dismissError, setDismissError] = useState(false);

  useEffect(() => {
    const unsubscribe = voiceService.subscribe((state) => {
      setVoiceState(state);
      if (state.error) {
        setDismissError(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Strict constraint: only render if room is private AND voice chat is enabled by host
  if (!room.settings.isPrivate || !room.settings.voiceChatEnabled) {
    return null;
  }

  const handleJoinVoice = async () => {
    sound.playClick();
    await voiceService.join(room.code);
  };

  const handleLeaveVoice = () => {
    sound.playClick();
    voiceService.leave();
  };

  const handleToggleMute = () => {
    sound.playClick();
    voiceService.toggleMute();
  };

  const participantsList = Array.from(voiceState.participants.values());
  const currentPlayer = room.players.find((p) => p.id === currentPlayerId);

  return (
    <div className="w-full bg-surface-container-lowest/90 backdrop-blur-md border-2 border-primary/20 rounded-2xl p-3 sm:p-4 tactile-card transition-all">
      {/* ERROR BANNER */}
      {voiceState.error && !dismissError && (
        <div className="mb-3 px-3 py-2 bg-error-container/80 text-on-error-container rounded-xl text-xs flex items-center justify-between gap-2 border border-error/30 animate-shake">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-error">warning</span>
            <span className="font-semibold">{voiceState.error}</span>
          </div>
          <button
            onClick={() => setDismissError(true)}
            className="p-1 hover:bg-black/10 rounded-lg text-xs"
            title="Dismiss"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* AUTOPLAY BLOCKED RECOVERY BANNER */}
      {voiceState.autoplayBlocked && (
        <div className="mb-3 px-3 py-2 bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs flex items-center justify-between gap-2 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-amber-600">volume_off</span>
            <span className="font-semibold">Audio playback is restricted by your browser. Tap to enable incoming audio.</span>
          </div>
          <button
            onClick={() => voiceService.resumeAudioPlayback()}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 shadow-sm"
          >
            Enable Audio
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* LEFT: STATUS & PARTICIPANT AVATARS */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Status Indicator Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-surface-container-high border border-outline-variant">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                voiceState.isActive
                  ? 'bg-emerald-500 shadow-[0_0_8px_#10B981] animate-pulse'
                  : 'bg-outline/50'
              }`}
            />
            <span className="text-[11px] font-black uppercase tracking-wider text-on-surface">
              {voiceState.isActive ? 'Voice Live' : 'Voice Chat'}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-surface-container text-outline">
              {participantsList.length + (voiceState.isActive ? 1 : 0)} Connected
            </span>
          </div>

          {/* ACTIVE SPEAKERS AVATAR ROW */}
          <div className="flex items-center -space-x-2 overflow-x-auto py-1">
            {/* Current user avatar (if active in voice) */}
            {voiceState.isActive && currentPlayer && (
              <div
                className={`relative w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center text-xs font-black shadow-sm ${
                  voiceState.isSpeaking
                    ? 'ring-4 ring-emerald-400 border-white scale-110'
                    : 'border-primary bg-primary-fixed text-on-primary-fixed'
                }`}
                style={{ backgroundColor: currentPlayer.avatar?.color || '#7C3AED' }}
                title={`${currentPlayer.name} (You) ${voiceState.isMuted ? '[Muted]' : ''}`}
              >
                <span className="text-[11px] text-white">
                  {currentPlayer.name.charAt(0).toUpperCase()}
                </span>
                {voiceState.isMuted && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-error text-white flex items-center justify-center text-[9px] shadow">
                    <span className="material-symbols-outlined text-[10px]">mic_off</span>
                  </span>
                )}
              </div>
            )}

            {/* Remote participants avatars */}
            {participantsList.map((participant) => (
              <div
                key={participant.socketId}
                className={`relative w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center text-xs font-black shadow-sm ${
                  participant.isSpeaking
                    ? 'ring-4 ring-emerald-400 border-white scale-110'
                    : 'border-surface-container-highest bg-surface-container-high text-on-surface'
                }`}
                style={{ backgroundColor: participant.avatar?.color || '#06B6D4' }}
                title={`${participant.playerName} ${participant.isMuted ? '[Muted]' : ''}`}
              >
                <span className="text-[11px] text-white">
                  {participant.playerName.charAt(0).toUpperCase()}
                </span>
                {participant.isMuted && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-error text-white flex items-center justify-center text-[9px] shadow">
                    <span className="material-symbols-outlined text-[10px]">mic_off</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: CONTROLS (JOIN / MUTE / LEAVE) */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {!voiceState.isActive ? (
            <button
              onClick={handleJoinVoice}
              disabled={voiceState.isConnecting}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_0_#047857] hover:shadow-[0_2px_0_#047857] hover:translate-y-0.5 active:translate-y-1 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">
                {voiceState.isConnecting ? 'hourglass_top' : 'mic'}
              </span>
              <span>{voiceState.isConnecting ? 'Connecting...' : 'Join Voice'}</span>
            </button>
          ) : (
            <>
              {/* MUTE / UNMUTE BUTTON */}
              <button
                onClick={handleToggleMute}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  voiceState.isMuted
                    ? 'bg-error text-on-error shadow-[0_3px_0_#991B1B]'
                    : 'bg-surface-container-highest text-on-surface hover:bg-surface-container-high border border-outline-variant shadow-[0_3px_0_#334155]'
                } active:translate-y-0.5`}
                title={voiceState.isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                <span className="material-symbols-outlined text-base">
                  {voiceState.isMuted ? 'mic_off' : 'mic'}
                </span>
                <span>{voiceState.isMuted ? 'Unmute' : 'Mute'}</span>
              </button>

              {/* LEAVE VOICE BUTTON */}
              <button
                onClick={handleLeaveVoice}
                className="px-3 py-2 bg-error/10 hover:bg-error/20 text-error border border-error/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:translate-y-0.5"
                title="Disconnect from voice communication"
              >
                <span className="material-symbols-outlined text-base">call_end</span>
                <span>Disconnect</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
