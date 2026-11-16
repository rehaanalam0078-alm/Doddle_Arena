import React, { useState } from 'react';
import { PlayerAvatar } from '@/components/common/PlayerAvatar';

interface LeaderboardViewProps {
  onBackToLobby: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onBackToLobby }) => {
  const [filter, setFilter] = useState<'weekly' | 'alltime' | 'friends'>('weekly');
  const [search, setSearch] = useState('');

  const players = [
    { rank: 1, name: 'DoodleQueen', avatar: 'fox' as const, hat: 'beret' as const, color: '#F59E0B', score: 18420, wins: 342, accuracy: '98.4%' },
    { rank: 2, name: 'NeonSketcher', avatar: 'robot' as const, hat: 'headphones' as const, color: '#06B6D4', score: 16190, wins: 289, accuracy: '96.1%' },
    { rank: 3, name: 'BananaCanvas', avatar: 'monkey' as const, hat: 'cap' as const, color: '#EAB308', score: 14880, wins: 245, accuracy: '94.8%' },
    { rank: 4, name: 'SpeedyPencil_99', avatar: 'cat' as const, hat: 'beret' as const, color: '#7C3AED', score: 12450, wins: 198, accuracy: '93.2%' },
    { rank: 5, name: 'PixelPanda', avatar: 'panda' as const, hat: 'sunglasses' as const, color: '#10B981', score: 10890, wins: 172, accuracy: '91.5%' },
    { rank: 6, name: 'ChalkNinja', avatar: 'cat' as const, hat: 'sunglasses' as const, color: '#8B5CF6', score: 9450, wins: 145, accuracy: '89.7%' },
    { rank: 7, name: 'ColorBlaster', avatar: 'panda' as const, hat: 'none' as const, color: '#6366F1', score: 8200, wins: 120, accuracy: '88.1%' },
    { rank: 8, name: 'InkMasterX', avatar: 'monkey' as const, hat: 'cap' as const, color: '#10B981', score: 7650, wins: 110, accuracy: '86.4%' },
  ];

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-3xl tactile-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-3xl fill-icon">trophy</span>
          </div>
          <div>
            <h1 className="font-headline-lg text-2xl sm:text-3xl font-black text-on-surface">
              Global Doodler Leaderboard
            </h1>
            <p className="text-xs text-outline font-medium">
              Rankings updated live • Season 4 Championship
            </p>
          </div>
        </div>
        <button
          onClick={onBackToLobby}
          className="px-4 py-2.5 tactile-btn-ghost rounded-xl text-xs font-bold"
        >
          ← Back to Lobby
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant">
        <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-xl w-full sm:w-auto">
          {(['weekly', 'alltime', 'friends'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                filter === tab ? 'bg-primary text-white shadow-sm' : 'text-outline hover:text-on-surface'
              }`}
            >
              {tab === 'alltime' ? 'All Time' : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search doodler tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:border-primary font-medium"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 tactile-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-outline-variant text-[11px] font-black uppercase text-outline tracking-wider pb-3">
                <th className="pb-3 pl-2">Rank</th>
                <th className="pb-3">Doodler</th>
                <th className="pb-3 text-center">Wins</th>
                <th className="pb-3 text-center">Accuracy</th>
                <th className="pb-3 text-right pr-2">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {filtered.map((p) => (
                <tr key={p.name} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3.5 pl-2">
                    <span
                      className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center ${
                        p.rank === 1
                          ? 'bg-amber-400 text-on-surface'
                          : p.rank === 2
                          ? 'bg-slate-300 text-on-surface'
                          : p.rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-surface-container text-outline'
                      }`}
                    >
                      {p.rank}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <PlayerAvatar style={p.avatar} hat={p.hat} color={p.color} size="sm" />
                      <span className="font-bold text-sm text-on-surface">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-center font-bold text-xs text-on-surface">
                    {p.wins}
                  </td>
                  <td className="py-3.5 text-center font-bold text-xs text-emerald-600">
                    {p.accuracy}
                  </td>
                  <td className="py-3.5 text-right pr-2 font-black text-base text-primary tabular-nums">
                    {p.score.toLocaleString()} PTS
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
