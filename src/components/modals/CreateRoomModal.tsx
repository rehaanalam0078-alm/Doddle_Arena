import React, { useState } from 'react';
import { RoomSettings } from '@/types/game';
import { sound } from '@/services/sound';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (settings: Partial<RoomSettings>, customCode?: string) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
}) => {
  const [rounds, setRounds] = useState(3);
  const [drawTime, setDrawTime] = useState<60 | 80 | 100 | 120>(80);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [wordPack, setWordPack] = useState('classic');
  const [customCode, setCustomCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    onCreateRoom(
      {
        rounds,
        drawTimeSeconds: drawTime,
        maxPlayers,
        difficulty,
        wordPackId: wordPack,
        isPrivate: true,
      },
      customCode.trim() || undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 tactile-card max-w-lg w-full flex flex-col gap-6 animate-scaleUp">
        <div className="flex items-center justify-between border-b-2 border-outline-variant pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">meeting_room</span>
            </div>
            <div>
              <h2 className="font-headline-md text-xl font-bold text-on-surface">
                Create Private Room
              </h2>
              <p className="text-xs text-outline font-medium">
                Customize your party game settings & rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          {/* Rounds */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              Number of Rounds ({rounds})
            </label>
            <div className="flex items-center gap-2">
              {[2, 3, 5, 8, 10].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRounds(r)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    rounds === r
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface-container-low border-outline-variant hover:bg-surface-container-high'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Draw Time */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              Drawing Clock (Seconds)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {([60, 80, 100, 120] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDrawTime(t)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    drawTime === t
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface-container-low border-outline-variant hover:bg-surface-container-high'
                  }`}
                >
                  {t}s
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              Wordpack Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                    difficulty === d
                      ? 'bg-secondary text-white border-secondary shadow-sm'
                      : 'bg-surface-container-low border-outline-variant hover:bg-surface-container-high'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Room Code (Optional) */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              Custom Room Code (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. ROAR-999"
              maxLength={12}
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border-2 border-outline-variant font-bold text-sm tracking-wider uppercase focus:border-primary outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 tactile-btn-ghost rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 tactile-btn-secondary rounded-xl text-xs font-bold"
            >
              Create Table Now →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
