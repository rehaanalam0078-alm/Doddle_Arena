import React, { useState } from 'react';
import { sound } from '@/services/sound';

interface TournamentRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentTitle: string;
}

export const TournamentRegisterModal: React.FC<TournamentRegisterModalProps> = ({
  isOpen,
  onClose,
  tournamentTitle,
}) => {
  const [teamTag, setTeamTag] = useState('');
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playCorrect();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 tactile-card max-w-md w-full flex flex-col gap-5 text-left animate-scaleUp">
        <div className="flex items-center justify-between border-b-2 border-outline-variant pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">
              military_tech
            </span>
            <h2 className="font-headline-md text-xl font-bold text-on-surface">
              Cup Registration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl font-black">
                check_circle
              </span>
            </div>
            <h3 className="font-headline-md text-xl font-bold text-on-surface">
              Registration Confirmed!
            </h3>
            <p className="text-xs text-outline font-medium">
              You are officially entered into the bracket for {tournamentTitle}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                Tournament
              </span>
              <h3 className="font-bold text-base text-on-surface">{tournamentTitle}</h3>
              <p className="text-xs text-outline mt-0.5">Prize Pool: $2,500 Cash + Trophy</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Player Tag / Handle
              </label>
              <input
                type="text"
                required
                placeholder="e.g. #DOODLE-PRO"
                value={teamTag}
                onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border-2 border-outline-variant font-bold text-sm tracking-wider uppercase focus:border-primary outline-none"
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer mt-1">
              <input
                type="checkbox"
                required
                checked={acceptedRules}
                onChange={(e) => setAcceptedRules(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary accent-primary"
              />
              <span className="text-xs text-outline font-medium">
                I agree to the Anti-Cheat regulations, round countdown clocks, and sportsmanship policies.
              </span>
            </label>

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
                disabled={!acceptedRules}
                className="flex-1 py-3 tactile-btn-primary rounded-xl text-xs font-bold"
              >
                Confirm Entry
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
