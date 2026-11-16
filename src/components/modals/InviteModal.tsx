import React, { useState } from 'react';
import { sound } from '@/services/sound';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  roomCode,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const inviteUrl = `${window.location.origin}/?join=${roomCode}`;

  const handleCopyCode = async () => {
    sound.playClick();
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.warn('Clipboard failed', e);
    }
  };

  const handleCopyLink = async () => {
    sound.playClick();
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.warn('Clipboard failed', e);
    }
  };

  const handleShare = async () => {
    sound.playClick();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Doodle Arena room!',
          text: `Draw and guess with me in Doodle Arena! Room code: #${roomCode}`,
          url: inviteUrl,
        });
      } catch (e) {}
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 tactile-card max-w-md w-full flex flex-col gap-5 text-center animate-scaleUp">
        <div className="flex items-center justify-between border-b-2 border-outline-variant pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">group_add</span>
            <h2 className="font-headline-md text-xl font-bold text-on-surface">
              Invite Doodlers
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Room Code Direct Box */}
        <div className="bg-surface-container-low p-5 rounded-2xl border-2 border-dashed border-primary/40 flex flex-col items-center gap-2">
          <span className="text-xs font-bold text-outline uppercase tracking-wider">
            Room Code
          </span>
          <span className="font-headline-xl text-3xl font-black text-primary tracking-widest">
            #{roomCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="tactile-btn-ghost px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 mt-1"
          >
            <span className="material-symbols-outlined text-base">
              {copiedCode ? 'done' : 'content_copy'}
            </span>
            <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Full Link Box */}
        <div className="flex flex-col text-left gap-1.5">
          <label className="text-xs font-bold text-on-surface">Share Direct Link</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-xs font-mono text-outline select-all"
            />
            <button
              onClick={handleCopyLink}
              className="tactile-btn-primary px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap"
            >
              {copiedLink ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Social / Native Share Action */}
        <button
          onClick={handleShare}
          className="w-full py-3 tactile-btn-tertiary rounded-xl text-xs font-bold flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">share</span>
          <span>Share Invitation</span>
        </button>
      </div>
    </div>
  );
};
