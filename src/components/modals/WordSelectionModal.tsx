import React, { useState, useEffect } from 'react';
import { WordOption } from '@/types/game';
import { sound } from '@/services/sound';

interface WordSelectionModalProps {
  options: WordOption[];
  onSelectWord: (word: string) => void;
  durationSeconds?: number;
}

export const WordSelectionModal: React.FC<WordSelectionModalProps> = ({
  options,
  onSelectWord,
  durationSeconds = 15,
}) => {
  const [selectedWord, setSelectedWord] = useState<string>(options[0]?.word || '');
  const [countdown, setCountdown] = useState(durationSeconds);

  useEffect(() => {
    if (options.length > 0 && !selectedWord) {
      setSelectedWord(options[0].word);
    }
  }, [options]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto select on zero
          onSelectWord(selectedWord || options[0]?.word || 'Pencil');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedWord, options]);

  const handleCardClick = (word: string) => {
    sound.playClick();
    setSelectedWord(word);
  };

  const handleConfirm = () => {
    sound.playClick();
    onSelectWord(selectedWord);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 tactile-card max-w-2xl w-full flex flex-col items-center text-center gap-6 animate-scaleUp">
        {/* Header with timer */}
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 border-b-2 border-outline-variant pb-4">
          <div className="text-left">
            <span className="inline-block px-3 py-1 bg-primary-fixed text-primary font-bold text-xs rounded-full uppercase tracking-wider mb-1">
              Your Turn to Draw!
            </span>
            <h2 className="font-headline-lg text-2xl sm:text-3xl font-extrabold text-on-surface">
              Choose a Mystery Word
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-2xl border border-outline-variant">
            <span className="material-symbols-outlined text-primary text-xl">timer</span>
            <span className="font-extrabold text-lg text-primary tabular-nums">
              {countdown}s
            </span>
          </div>
        </div>

        {/* 3 Word Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          {options.map((opt) => {
            const isSelected = selectedWord.toLowerCase() === opt.word.toLowerCase();
            const badgeColor =
              opt.difficulty === 'easy'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : opt.difficulty === 'medium'
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-rose-100 text-rose-800 border-rose-300';

            return (
              <div
                key={opt.word}
                onClick={() => handleCardClick(opt.word)}
                className={`p-5 rounded-2xl cursor-pointer text-left flex flex-col justify-between transition-all duration-150 transform hover:-translate-y-1 ${
                  isSelected
                    ? 'tactile-card border-primary bg-primary-fixed/20 ring-4 ring-primary/20 shadow-md'
                    : 'tactile-card bg-surface-container-lowest hover:border-primary/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}
                    >
                      {opt.difficulty}
                    </span>
                    <span className="text-xs font-black text-primary">
                      +{opt.points} PTS
                    </span>
                  </div>
                  <h3 className="font-headline-md text-xl font-bold text-on-surface">
                    {opt.word}
                  </h3>
                  <p className="text-xs text-outline font-medium mt-1">
                    {opt.category}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? 'text-primary' : 'text-outline'
                    }`}
                  >
                    {isSelected ? '✓ Selected' : 'Click to Pick'}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                      isSelected
                        ? 'bg-primary border-primary text-white'
                        : 'border-outline-variant'
                    }`}
                  >
                    {isSelected && (
                      <span className="material-symbols-outlined text-sm font-black">
                        check
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Confirm Action */}
        <div className="w-full flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            className="w-full sm:w-auto px-8 py-3.5 tactile-btn-primary rounded-xl font-headline-md text-base"
            onClick={handleConfirm}
          >
            Start Drawing "{selectedWord}" →
          </button>
        </div>
      </div>
    </div>
  );
};
