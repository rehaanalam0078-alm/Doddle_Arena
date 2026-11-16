import React from 'react';
import { ChatMessage } from '@/types/game';

interface ChatMessageItemProps {
  message: ChatMessage;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  if (message.type === 'correct') {
    return (
      <div className="p-2.5 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary-fixed-dim/60 shadow-sm flex items-center justify-between text-xs font-bold animate-fadeIn">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-tertiary fill-icon">
            check_circle
          </span>
          <span>
            <strong className="text-on-surface">{message.playerName}</strong> guessed the word!
          </span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider bg-tertiary text-white px-2 py-0.5 rounded-md">
          SOLVED
        </span>
      </div>
    );
  }

  if (message.type === 'close') {
    return (
      <div className="p-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 text-xs font-bold animate-fadeIn">
        <span className="material-symbols-outlined text-sm text-amber-700">warning</span>
        <span>
          <strong className="text-amber-950">{message.playerName}</strong> is very close!
        </span>
      </div>
    );
  }

  if (message.type === 'system') {
    return (
      <div className="text-center my-1">
        <span className="inline-block px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-bold text-[11px]">
          {message.text}
        </span>
      </div>
    );
  }

  // Normal Chat Message
  return (
    <div className="py-1 px-1.5 rounded-lg hover:bg-surface-container-low transition-colors flex items-start gap-1.5 text-xs">
      <span className="font-bold text-on-surface whitespace-nowrap">
        {message.playerName}:
      </span>
      <span className="text-on-surface-variant break-words font-medium">
        {message.text}
      </span>
    </div>
  );
};
