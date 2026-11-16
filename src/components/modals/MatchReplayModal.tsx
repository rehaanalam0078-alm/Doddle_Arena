import React, { useState, useEffect, useRef } from 'react';
import { Stroke } from '@/types/game';
import { DrawingCanvas } from '../canvas/DrawingCanvas';

interface MatchReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  secretWord: string;
  drawerName: string;
  strokes?: Stroke[];
}

export const MatchReplayModal: React.FC<MatchReplayModalProps> = ({
  isOpen,
  onClose,
  secretWord,
  drawerName,
  strokes = [],
}) => {
  const [currentStep, setCurrentStep] = useState(strokes.length);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);

  useEffect(() => {
    setCurrentStep(strokes.length);
  }, [strokes]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && currentStep < strokes.length) {
      timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 50 / speed);
    } else if (currentStep >= strokes.length) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, strokes.length, speed]);

  if (!isOpen) return null;

  const visibleStrokes = strokes.slice(0, currentStep);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 tactile-card max-w-2xl w-full flex flex-col gap-4 text-center animate-scaleUp">
        <div className="flex items-center justify-between border-b-2 border-outline-variant pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">replay</span>
            <div className="text-left">
              <h2 className="font-headline-md text-lg font-bold text-on-surface">
                Match Artwork Replay
              </h2>
              <p className="text-xs text-outline font-medium">
                "{secretWord}" sketched by {drawerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Canvas Display */}
        <div className="w-full aspect-[4/3] max-h-[380px] rounded-2xl overflow-hidden border-2 border-outline-variant">
          <DrawingCanvas isInteractive={false} strokes={visibleStrokes} />
        </div>

        {/* Scrubber & Controls */}
        <div className="flex flex-col gap-3 pt-2">
          {/* Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-outline">
              {currentStep}/{strokes.length}
            </span>
            <input
              type="range"
              min={0}
              max={strokes.length}
              value={currentStep}
              onChange={(e) => {
                setCurrentStep(Number(e.target.value));
                setIsPlaying(false);
              }}
              className="flex-1 accent-primary h-2 bg-surface-container-high rounded-lg cursor-pointer"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className="px-4 py-2 tactile-btn-primary rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                onClick={() => {
                  setCurrentStep(0);
                  setIsPlaying(true);
                }}
                className="px-3 py-2 tactile-btn-ghost rounded-xl text-xs font-bold"
              >
                Restart
              </button>
            </div>

            {/* Speed pills */}
            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl">
              {([1, 2, 4] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    speed === s ? 'bg-primary text-white shadow-sm' : 'text-outline hover:text-on-surface'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
