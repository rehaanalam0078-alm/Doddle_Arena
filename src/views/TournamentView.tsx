import React, { useState } from 'react';
import { Tournament, TournamentMatch } from '@/types/game';
import { PlayerAvatar } from '@/components/common/PlayerAvatar';
import { TournamentRegisterModal } from '@/components/modals/TournamentRegisterModal';
import { sound } from '@/services/sound';

interface TournamentViewProps {
  tournament: Tournament;
  onSpectateMatch: (roomCode: string) => void;
  onNavigateToCompetitive: () => void;
  onNavigateToLobby: () => void;
}

export const TournamentView: React.FC<TournamentViewProps> = ({
  tournament,
  onSpectateMatch,
  onNavigateToCompetitive,
  onNavigateToLobby,
}) => {
  const [stageFilter, setStageFilter] = useState<'all' | 'quarterfinals' | 'semifinals' | 'finals'>('all');
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [feedMessages, setFeedMessages] = useState<string[]>([
    'DoodleQueen advanced to Semifinals with a clutch 840 pt solve!',
    'QF Match 3 is now LIVE between BananaCanvas and PixelGhost!',
    'Over 1,200 spectators are currently watching the tournament bracket.',
  ]);
  const [chatInput, setChatInput] = useState('');

  const filteredMatches = tournament.matches.filter((m) => {
    if (stageFilter === 'all') return true;
    return m.bracketRound === stageFilter;
  });

  const handleSendFeedMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sound.playClick();
    setFeedMessages((prev) => [...prev, `You: ${chatInput.trim()}`]);
    setChatInput('');
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8 text-left">
      {/* TOURNAMENT OVERVIEW BANNER */}
      <div className="bg-gradient-to-r from-primary to-primary-container text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-white/20 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">
              LIVE ESPORTS CUP
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              QUARTERFINALS IN PROGRESS
            </span>
          </div>
          <h1 className="font-headline-xl text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            {tournament.title}
          </h1>
          <p className="text-xs sm:text-sm text-on-primary-container font-medium mt-1">
            Prize Pool: {tournament.prizePool} • {tournament.participantCount} Qualified Doodlers
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setRegisterModalOpen(true)}
            className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">military_tech</span>
            <span>Register Next Cup</span>
          </button>
          <button
            onClick={onNavigateToCompetitive}
            className="px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs"
          >
            ← Ranked Arena
          </button>
        </div>
      </div>

      {/* BRACKET STAGE FILTERS */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-2xl">
          {(['all', 'quarterfinals', 'semifinals', 'finals'] as const).map((stage) => (
            <button
              key={stage}
              onClick={() => {
                sound.playClick();
                setStageFilter(stage);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                stageFilter === stage
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              {stage === 'all' ? 'All Matches' : stage}
            </button>
          ))}
        </div>

        <span className="text-xs font-bold text-outline">
          {filteredMatches.length} Bracket Matches Displayed
        </span>
      </div>

      {/* INTERACTIVE VISUAL TOURNAMENT BRACKET & MATCH CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMatches.map((m) => {
          const isLive = m.status === 'live';
          const isCompleted = m.status === 'completed';

          return (
            <div
              key={m.id}
              className={`p-5 rounded-3xl tactile-card bg-surface-container-lowest flex flex-col justify-between transition-all ${
                isLive
                  ? 'border-emerald-400 ring-4 ring-emerald-400/20 shadow-md'
                  : 'border-outline-variant'
              }`}
            >
              <div>
                {/* Match Header Tag */}
                <div className="flex items-center justify-between mb-4 border-b border-outline-variant pb-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-outline">
                    {m.bracketRound.toUpperCase()} • MATCH #{m.matchIndex}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      isLive
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                        : isCompleted
                        ? 'bg-surface-container text-outline'
                        : 'bg-primary-fixed text-primary'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>

                {/* Player 1 Row */}
                <div
                  className={`flex items-center justify-between p-2.5 rounded-xl mb-2 ${
                    m.winnerId === m.player1.id ? 'bg-amber-50 font-bold' : 'bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <PlayerAvatar
                      style={m.player1.avatar.style}
                      hat={m.player1.avatar.hat}
                      color={m.player1.avatar.color}
                      size="sm"
                    />
                    <span className="text-xs font-bold text-on-surface truncate max-w-[120px]">
                      {m.player1.name}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-black text-on-surface">
                    {m.player1.score}
                  </span>
                </div>

                {/* Player 2 Row */}
                <div
                  className={`flex items-center justify-between p-2.5 rounded-xl ${
                    m.winnerId === m.player2.id ? 'bg-amber-50 font-bold' : 'bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <PlayerAvatar
                      style={m.player2.avatar.style}
                      hat={m.player2.avatar.hat}
                      color={m.player2.avatar.color}
                      size="sm"
                    />
                    <span className="text-xs font-bold text-on-surface truncate max-w-[120px]">
                      {m.player2.name}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-black text-on-surface">
                    {m.player2.score}
                  </span>
                </div>
              </div>

              {/* Match CTA */}
              <div className="mt-5 pt-3 border-t border-outline-variant flex items-center justify-between">
                <span className="text-[11px] font-mono text-outline">
                  Room: #{m.roomCode || 'TBD'}
                </span>
                {m.roomCode ? (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onSpectateMatch(m.roomCode!);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                      isLive ? 'tactile-btn-primary' : 'tactile-btn-ghost text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    <span>{isLive ? 'Spectate Live' : 'View Table'}</span>
                  </button>
                ) : (
                  <span className="text-xs text-outline font-semibold">Upcoming</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TOURNAMENT LIVE CHATTER FEED */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 tactile-card flex flex-col gap-4">
        <div className="flex items-center justify-between border-b-2 border-outline-variant pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">forum</span>
            <h3 className="font-headline-md text-base font-bold text-on-surface">
              Tournament Live Feed
            </h3>
          </div>
          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            1,280 Spectators
          </span>
        </div>

        {/* Message Feed */}
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-xs">
          {feedMessages.map((msg, i) => (
            <div key={i} className="p-2 rounded-xl bg-surface-container-low text-on-surface-variant font-medium">
              {msg}
            </div>
          ))}
        </div>

        <form onSubmit={handleSendFeedMessage} className="flex items-center gap-2 pt-2 border-t border-outline-variant">
          <input
            type="text"
            placeholder="Cheer on your favorite player in tournament chat..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-xs outline-none focus:border-primary font-medium"
          />
          <button
            type="submit"
            className="px-4 py-2.5 tactile-btn-primary rounded-xl text-xs font-bold"
          >
            Send
          </button>
        </form>
      </div>

      {/* Tournament Registration Modal */}
      <TournamentRegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        tournamentTitle={tournament.title}
      />
    </div>
  );
};
