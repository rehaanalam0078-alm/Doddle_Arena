import React, { useEffect, useState } from 'react';
import { RoomState } from '@/types/game';
import { sound } from '@/services/sound';
import { getApiUrl } from '@/config/backend';

interface RoomsDirectoryViewProps {
  onJoinRoom: (code: string) => void;
  onSpectateRoom: (code: string) => void;
  onCreateRoom: () => void;
  onBackToLobby: () => void;
}

export const RoomsDirectoryView: React.FC<RoomsDirectoryViewProps> = ({
  onJoinRoom,
  onSpectateRoom,
  onCreateRoom,
  onBackToLobby,
}) => {
  const [rooms, setRooms] = useState<RoomState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(getApiUrl('/api/rooms/public'))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRooms(data);
        } else {
          throw new Error('No rooms returned');
        }
        setLoading(false);
      })
      .catch(() => {
        // Fallback demo rooms
        setRooms([
          {
            code: 'PARTY-ANIMALS',
            hostId: 'host_1',
            settings: {
              isPrivate: false,
              maxPlayers: 8,
              rounds: 3,
              drawTimeSeconds: 80,
              difficulty: 'medium',
              wordPackId: 'classic',
              language: 'en',
            },
            players: [
              { id: '1', socketId: '', name: 'PixelMaster', avatar: { style: 'cat', hat: 'beret', color: '#7C3AED' }, score: 840, rank: 1, isHost: true, isReady: true, isDrawing: true, hasGuessed: false },
              { id: '2', socketId: '', name: 'SpeedyDoodler', avatar: { style: 'fox', hat: 'headphones', color: '#F59E0B' }, score: 620, rank: 2, isHost: false, isReady: true, isDrawing: false, hasGuessed: true },
            ],
            phase: 'DRAWING',
            currentRound: 2,
            totalRounds: 3,
            currentDrawerId: '1',
            timerStart: Date.now() - 30000,
            timerEnd: Date.now() + 50000,
            durationSeconds: 80,
            clue: 'F _ _ M _ _ _ O',
            category: 'Animals & Nature',
            letterCount: 8,
            difficultyPoints: 250,
            artworks: [],
          },
          {
            code: 'DOODLE-909',
            hostId: 'host_2',
            settings: {
              isPrivate: false,
              maxPlayers: 8,
              rounds: 3,
              drawTimeSeconds: 60,
              difficulty: 'hard',
              wordPackId: 'classic',
              language: 'en',
            },
            players: [
              { id: '3', socketId: '', name: 'ArtWizard', avatar: { style: 'monkey', hat: 'crown', color: '#06B6D4' }, score: 0, rank: 1, isHost: true, isReady: true, isDrawing: false, hasGuessed: false },
            ],
            phase: 'LOBBY',
            currentRound: 1,
            totalRounds: 3,
            currentDrawerId: null,
            timerStart: 0,
            timerEnd: 0,
            durationSeconds: 60,
            clue: '',
            category: '',
            letterCount: 0,
            difficultyPoints: 100,
            artworks: [],
          },
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-3xl tactile-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-3xl">grid_view</span>
          </div>
          <div>
            <h1 className="font-headline-lg text-2xl sm:text-3xl font-black text-on-surface">
              Public Rooms Directory
            </h1>
            <p className="text-xs text-outline font-medium">
              Join an open table or spectate high-stakes games in real time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToLobby}
            className="px-4 py-2.5 tactile-btn-ghost rounded-xl text-xs font-bold"
          >
            ← Lobby
          </button>
          <button
            onClick={onCreateRoom}
            className="px-4 py-2.5 tactile-btn-primary rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Create Room</span>
          </button>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {rooms.map((r) => {
          const isFull = r.players.length >= r.settings.maxPlayers;
          const isDrawing = r.phase === 'DRAWING';

          return (
            <div
              key={r.code}
              className="p-5 rounded-3xl tactile-card bg-surface-container-lowest flex flex-col justify-between hover:border-primary transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-outline-variant pb-2">
                  <span className="font-headline-md text-base font-black text-on-surface">
                    #{r.code}
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      isDrawing
                        ? 'bg-rose-100 text-rose-800 animate-pulse'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isDrawing ? 'IN GAME' : 'IN LOBBY'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-outline">
                  <div className="flex items-center justify-between">
                    <span>Players</span>
                    <strong className="text-on-surface">
                      {r.players.length} / {r.settings.maxPlayers}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Round Progress</span>
                    <strong className="text-on-surface">
                      Round {r.currentRound} of {r.totalRounds}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Round Clock</span>
                    <strong className="text-on-surface">{r.settings.drawTimeSeconds}s</strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-outline-variant flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    sound.playClick();
                    onSpectateRoom(r.code);
                  }}
                  className="flex-1 py-2 tactile-btn-ghost rounded-xl text-xs font-bold text-primary flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">visibility</span>
                  <span>Spectate</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    onJoinRoom(r.code);
                  }}
                  disabled={isFull}
                  className="flex-1 py-2 tactile-btn-primary rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {isFull ? 'Full' : 'Join Table →'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
