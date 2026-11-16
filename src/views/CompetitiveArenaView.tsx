import React, { useState } from 'react';
import { sound } from '@/services/sound';
import { PlayerAvatar } from '@/components/common/PlayerAvatar';
import { MatchReplayModal } from '@/components/modals/MatchReplayModal';

interface CompetitiveArenaViewProps {
  onQueueRanked: () => void;
  onCancelQueue: () => void;
  isQueued: boolean;
  queuePosition?: number;
  onNavigateToTournaments: () => void;
  onNavigateToLobby: () => void;
}

export const CompetitiveArenaView: React.FC<CompetitiveArenaViewProps> = ({
  onQueueRanked,
  onCancelQueue,
  isQueued,
  queuePosition = 1,
  onNavigateToTournaments,
  onNavigateToLobby,
}) => {
  const [selectedLeaderboardTab, setSelectedLeaderboardTab] = useState<'global' | 'regional' | 'friends'>('global');
  const [replayModalOpen, setReplayModalOpen] = useState(false);
  const [activeReplayWord, setActiveReplayWord] = useState('Flamingo');

  const recentBattles = [
    {
      id: 'bat_1',
      opponentName: 'NeonSketcher',
      opponentAvatar: 'robot' as const,
      result: 'VICTORY',
      score: '1,420 - 1,180',
      eloChange: +24,
      secretWord: 'Flamingo',
      date: '12m ago',
    },
    {
      id: 'bat_2',
      opponentName: 'DoodleQueen',
      opponentAvatar: 'fox' as const,
      result: 'DEFEAT',
      score: '980 - 1,350',
      eloChange: -18,
      secretWord: 'Rollercoaster',
      date: '48m ago',
    },
    {
      id: 'bat_3',
      opponentName: 'BananaCanvas',
      opponentAvatar: 'monkey' as const,
      result: 'VICTORY',
      score: '1,290 - 890',
      eloChange: +22,
      secretWord: 'Submarine',
      date: '2h ago',
    },
    {
      id: 'bat_4',
      opponentName: 'ChalkNinja',
      opponentAvatar: 'cat' as const,
      result: 'VICTORY',
      score: '1,100 - 950',
      eloChange: +16,
      secretWord: 'Kaleidoscope',
      date: '5h ago',
    },
  ];

  const handleOpenReplay = (word: string) => {
    sound.playClick();
    setActiveReplayWord(word);
    setReplayModalOpen(true);
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8 text-left">
      {/* HEADER BANNER & CASUAL TOGGLE */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 tactile-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-3xl fill-icon">military_tech</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-lg text-2xl sm:text-3xl font-black text-on-surface">
                Competitive Ranked Hub
              </h1>
              <span className="px-3 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider">
                SEASON 4 LIVE
              </span>
            </div>
            <p className="text-xs text-outline font-medium mt-0.5">
              Strict Clocks • Anti-Cheat Spoiler Masks • ELO Rating Ladder
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToLobby}
            className="px-4 py-2.5 tactile-btn-ghost rounded-xl text-xs font-bold"
          >
            ← Casual Lobby
          </button>
          <button
            onClick={onNavigateToTournaments}
            className="px-4 py-2.5 tactile-btn-primary rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">emoji_events</span>
            <span>Tournaments Bracket</span>
          </button>
        </div>
      </div>

      {/* RANKING STATUS CARD & MATCHMAKING DECK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Card 1: Player ELO & Tier Progress (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-surface-container-lowest to-surface-container-low p-6 sm:p-7 rounded-3xl tactile-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-outline">
                Your Division
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Top 12% Global
              </span>
            </div>

            <div className="flex items-center gap-4 my-2">
              <div className="w-16 h-16 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-2xl shadow-md border-2 border-amber-300">
                G2
              </div>
              <div>
                <h3 className="font-headline-md text-2xl font-black text-on-surface">
                  Gold II Division
                </h3>
                <span className="text-sm font-extrabold text-primary">
                  1,450 Rating Points
                </span>
              </div>
            </div>

            {/* ELO Target Bar */}
            <div className="mt-5 bg-surface-container p-3 rounded-2xl border border-outline-variant">
              <div className="flex items-center justify-between text-xs font-bold text-on-surface mb-1">
                <span>Promotion Target</span>
                <span className="text-outline">1,450 / 1,600 ELO</span>
              </div>
              <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: '72%' }}
                />
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-6 border-t border-outline-variant mt-4 text-center">
            <div>
              <span className="block font-headline-md text-lg font-black text-on-surface">
                62.8%
              </span>
              <span className="text-[10px] font-bold text-outline uppercase">Win Rate</span>
            </div>
            <div>
              <span className="block font-headline-md text-lg font-black text-on-surface">
                2.4s
              </span>
              <span className="text-[10px] font-bold text-outline uppercase">Avg Guess</span>
            </div>
            <div>
              <span className="block font-headline-md text-lg font-black text-amber-600">
                4 Win
              </span>
              <span className="text-[10px] font-bold text-outline uppercase">Streak</span>
            </div>
          </div>
        </div>

        {/* Card 2: Matchmaking Launch Deck (7 Cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-6 sm:p-7 rounded-3xl tactile-card flex flex-col justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-primary">
              Ranked Matchmaking
            </span>
            <h2 className="font-headline-lg text-2xl sm:text-3xl font-black text-on-surface mt-1">
              Find Ranked Duel
            </h2>
            <p className="text-xs text-outline font-medium mt-1">
              Test your speed and artistic intuition in calibrated competitive rooms.
            </p>

            {/* Matchmaking Queue State */}
            {isQueued ? (
              <div className="my-6 p-6 rounded-2xl bg-primary-fixed/30 border-2 border-primary flex flex-col items-center justify-center gap-3 animate-pulse text-center">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">
                  progress_activity
                </span>
                <div>
                  <h4 className="font-bold text-base text-primary">Searching for Opponent...</h4>
                  <p className="text-xs text-outline font-medium">
                    Queue Position #{queuePosition} • Calibrating match within 50 ELO
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCancelQueue}
                  className="px-5 py-2 tactile-btn-ghost rounded-xl text-xs font-bold text-rose-600 mt-2"
                >
                  Cancel Queue
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">timer</span>
                  </span>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">
                      Fast Clocks
                    </span>
                    <span className="text-[11px] text-outline">60s Round Timers</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">shield</span>
                  </span>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">
                      Anti-Cheat Shield
                    </span>
                    <span className="text-[11px] text-outline">Enforced Word Masking</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isQueued && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onQueueRanked();
                }}
                className="flex-1 py-4 tactile-btn-primary rounded-xl font-headline-md text-base flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-2xl">search</span>
                <span>FIND RANKED MATCH</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RECENT BATTLES LOG & LEADERBOARD TABS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Battle History (7 Cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-3xl p-6 tactile-card">
          <div className="flex items-center justify-between border-b-2 border-outline-variant pb-3 mb-4">
            <h3 className="font-headline-md text-lg font-bold text-on-surface">
              Recent Ranked Battles
            </h3>
            <span className="text-xs text-outline font-semibold">Last 4 Matches</span>
          </div>

          <div className="space-y-3">
            {recentBattles.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-3">
                  <PlayerAvatar style={b.opponentAvatar} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-on-surface">
                        vs {b.opponentName}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          b.result === 'VICTORY'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {b.result}
                      </span>
                    </div>
                    <span className="text-xs text-outline font-medium">
                      Word: "{b.secretWord}" • {b.score} • {b.date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-black text-sm tabular-nums ${
                      b.eloChange > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {b.eloChange > 0 ? `+${b.eloChange}` : b.eloChange} ELO
                  </span>
                  <button
                    onClick={() => handleOpenReplay(b.secretWord)}
                    className="tactile-btn-ghost px-3 py-1.5 rounded-xl text-xs font-bold text-primary flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">play_circle</span>
                    <span>Replay</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Competitive Leaderboard (5 Cols) */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-3xl p-6 tactile-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline-md text-base font-bold text-on-surface">
              Ranked Leaderboard
            </h3>
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl">
              {(['global', 'regional', 'friends'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedLeaderboardTab(tab)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                    selectedLeaderboardTab === tab
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-400 font-black text-xs text-white flex items-center justify-center">
                  1
                </span>
                <span className="font-bold text-xs text-on-surface">DoodleQueen</span>
              </div>
              <span className="font-black text-xs text-amber-900">2,150 ELO</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-300 font-black text-xs text-on-surface flex items-center justify-center">
                  2
                </span>
                <span className="font-bold text-xs text-on-surface">NeonSketcher</span>
              </div>
              <span className="font-black text-xs text-slate-700">1,980 ELO</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50 border border-orange-200">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-700 font-black text-xs text-white flex items-center justify-center">
                  3
                </span>
                <span className="font-bold text-xs text-on-surface">BananaCanvas</span>
              </div>
              <span className="font-black text-xs text-amber-900">1,840 ELO</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-surface-container font-bold text-xs text-outline flex items-center justify-center">
                  4
                </span>
                <span className="font-bold text-xs text-on-surface">ChalkNinja</span>
              </div>
              <span className="font-black text-xs text-primary">1,720 ELO</span>
            </div>
          </div>
        </div>
      </div>

      {/* Match Replay Modal */}
      <MatchReplayModal
        isOpen={replayModalOpen}
        onClose={() => setReplayModalOpen(false)}
        secretWord={activeReplayWord}
        drawerName="Opponent"
      />
    </div>
  );
};
