import React from 'react';

interface RulesHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesHelpModal: React.FC<RulesHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 tactile-card max-w-xl w-full flex flex-col gap-6 text-left max-h-[90vh] overflow-y-auto animate-scaleUp">
        <div className="flex items-center justify-between border-b-2 border-outline-variant pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">help</span>
            </div>
            <div>
              <h2 className="font-headline-md text-xl font-bold text-on-surface">
                How to Play Doodle Arena
              </h2>
              <p className="text-xs text-outline font-medium">Rules & Drawing Etiquette</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* 3 Step Guide */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant flex items-start gap-3">
            <span className="w-7 h-7 rounded-xl bg-primary text-white font-black text-xs flex items-center justify-center shrink-0">
              1
            </span>
            <div>
              <h4 className="font-bold text-sm text-on-surface">Pick a Mystery Word</h4>
              <p className="text-xs text-outline mt-0.5">
                When chosen as Drawer, select 1 of 3 tiered cards (Easy, Medium, or Hard).
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant flex items-start gap-3">
            <span className="w-7 h-7 rounded-xl bg-primary text-white font-black text-xs flex items-center justify-center shrink-0">
              2
            </span>
            <div>
              <h4 className="font-bold text-sm text-on-surface">Draw Like Crazy</h4>
              <p className="text-xs text-outline mt-0.5">
                Use brushes, flood fill, lines, and colors to sketch hints for the room.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant flex items-start gap-3">
            <span className="w-7 h-7 rounded-xl bg-primary text-white font-black text-xs flex items-center justify-center shrink-0">
              3
            </span>
            <div>
              <h4 className="font-bold text-sm text-on-surface">Guess & Bank Points</h4>
              <p className="text-xs text-outline mt-0.5">
                Type fast in chat! Sub-second guesses bank massive speed multipliers.
              </p>
            </div>
          </div>
        </div>

        {/* Etiquette Alert */}
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 text-xs flex items-start gap-2.5">
          <span className="material-symbols-outlined text-rose-600 text-lg">gavel</span>
          <div>
            <strong>Strict Drawing Rule:</strong> No writing letters, numbers, or spelling out the secret word! Violations result in round forfeiture.
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div>
          <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
            Pro Hotkeys
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between">
              <span className="font-medium text-outline">Theater Mode</span>
              <kbd className="px-2 py-0.5 bg-surface-container-lowest rounded border font-mono font-bold text-primary">
                T
              </kbd>
            </div>
            <div className="p-2 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between">
              <span className="font-medium text-outline">Spectator Cheer</span>
              <kbd className="px-2 py-0.5 bg-surface-container-lowest rounded border font-mono font-bold text-primary">
                C
              </kbd>
            </div>
            <div className="p-2 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between">
              <span className="font-medium text-outline">Mute / Unmute</span>
              <kbd className="px-2 py-0.5 bg-surface-container-lowest rounded border font-mono font-bold text-primary">
                M
              </kbd>
            </div>
            <div className="p-2 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between">
              <span className="font-medium text-outline">Spoiler Mask</span>
              <kbd className="px-2 py-0.5 bg-surface-container-lowest rounded border font-mono font-bold text-primary">
                S
              </kbd>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 tactile-btn-primary rounded-xl text-xs font-bold"
        >
          Got It, Let's Play!
        </button>
      </div>
    </div>
  );
};
