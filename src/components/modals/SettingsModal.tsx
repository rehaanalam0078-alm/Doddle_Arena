import React, { useState } from 'react';
import { sound } from '@/services/sound';
import { getBackendUrl, setBackendUrl } from '@/config/backend';
import { socketService } from '@/services/socket';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [sfxVolume, setSfxVolume] = useState(80);
  const [musicVolume, setMusicVolume] = useState(60);
  const [highContrast, setHighContrast] = useState(false);
  const [hintChimes, setHintChimes] = useState(true);
  const [serverUrl, setServerUrl] = useState(getBackendUrl());
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [pingMsg, setPingMsg] = useState('');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setPingStatus('testing');
    setPingMsg('Connecting to server...');
    const testTarget = (serverUrl || window.location.origin).replace(/\/+$/, '');
    try {
      const res = await fetch(`${testTarget}/api/health`, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPingStatus('success');
      setPingMsg(`Connected! ${data.onlineArtists || 1} online artist(s).`);
      sound.playCorrect();
    } catch (e: any) {
      setPingStatus('error');
      setPingMsg(`Could not connect: ${e.message || 'Check URL or CORS'}`);
    }
  };

  const handleSave = () => {
    sound.playClick();
    setBackendUrl(serverUrl);
    socketService.reconnect(serverUrl || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 tactile-card max-w-md w-full flex flex-col gap-6 text-left animate-scaleUp">
        <div className="flex items-center justify-between border-b-2 border-outline-variant pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center text-primary font-bold">
              <span className="material-symbols-outlined text-2xl">settings</span>
            </div>
            <div>
              <h2 className="font-headline-md text-xl font-bold text-on-surface">
                Game Settings
              </h2>
              <p className="text-xs text-outline font-medium">Audio, Display & Gameplay</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {/* SFX Volume */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-on-surface mb-2">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">
                  volume_up
                </span>
                Sound Effects
              </span>
              <span>{sfxVolume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={sfxVolume}
              onChange={(e) => {
                setSfxVolume(Number(e.target.value));
                sound.playClick();
              }}
              className="w-full accent-primary h-2 bg-surface-container-high rounded-lg cursor-pointer"
            />
          </div>

          {/* Music Volume */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-on-surface mb-2">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">
                  music_note
                </span>
                Background Music
              </span>
              <span>{musicVolume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={musicVolume}
              onChange={(e) => setMusicVolume(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-surface-container-high rounded-lg cursor-pointer"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-outline-variant">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold text-on-surface">Hint Reveal Chimes</span>
              <input
                type="checkbox"
                checked={hintChimes}
                onChange={(e) => setHintChimes(e.target.checked)}
                className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold text-on-surface">High-Contrast Canvas</span>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary"
              />
            </label>
          </div>

          {/* Multiplayer Backend Server (For GitHub Pages & Render/Railway) */}
          <div className="pt-3 border-t border-outline-variant flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">dns</span>
                Multiplayer Backend URL
              </span>
              <span className="text-[10px] text-outline font-semibold">Render / Railway</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="https://doodle-arena.onrender.com"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-surface-container-high rounded-xl text-xs font-medium text-on-surface border border-outline-variant outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={pingStatus === 'testing'}
                className="px-3 py-2 bg-surface-container hover:bg-surface-container-highest rounded-xl text-xs font-bold text-on-surface border border-outline-variant shrink-0"
              >
                {pingStatus === 'testing' ? 'Testing...' : 'Test'}
              </button>
            </div>
            {pingMsg && (
              <p
                className={`text-[11px] font-semibold ${
                  pingStatus === 'success' ? 'text-emerald-500' : 'text-error'
                }`}
              >
                {pingMsg}
              </p>
            )}
            <p className="text-[10px] text-outline font-medium">
              Leave blank when hosting frontend and backend on the same server, or enter your Render/Railway backend URL for GitHub Pages.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 tactile-btn-primary rounded-xl text-xs font-bold mt-2"
        >
          Save & Apply Settings
        </button>
      </div>
    </div>
  );
};
