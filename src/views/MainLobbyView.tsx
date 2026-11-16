import React, { useState, useEffect } from 'react';
import { PlayerAvatar } from '@/components/common/PlayerAvatar';
import { PlayerAvatar as IPlayerAvatar, AvatarStyle, AvatarHat } from '@/types/game';
import { sound } from '@/services/sound';

interface MainLobbyViewProps {
  userAvatar: IPlayerAvatar;
  onChangeAvatar: (avatar: IPlayerAvatar) => void;
  userName: string;
  onChangeName: (name: string) => void;
  onPlayCasual: () => void;
  onOpenCompetitive: () => void;
  onCreatePrivateRoom: () => void;
  onJoinRoomByCode: (code: string) => void;
  onViewLeaderboard: () => void;
  onViewRooms: () => void;
  onJumpIntoFeatured: () => void;
}

const AVATAR_STYLES: AvatarStyle[] = ['cat', 'fox', 'robot', 'monkey', 'panda', 'bear'];
const AVATAR_HATS: AvatarHat[] = ['none', 'beret', 'headphones', 'crown', 'cap', 'sunglasses'];
const AVATAR_COLORS = ['#7C3AED', '#FF6B6B', '#06B6D4', '#F59E0B', '#10B981', '#EC4899'];

const RANDOM_NAMES = [
  'SpeedyPencil_99',
  'NeonSketcher',
  'DoodleQueen',
  'BananaCanvas',
  'PixelPanda',
  'ChalkNinja',
  'ColorBlaster',
  'ArtisticFox',
  'QuickDrawKid',
  'MasterStroke',
];

export const MainLobbyView: React.FC<MainLobbyViewProps> = ({
  userAvatar,
  onChangeAvatar,
  userName,
  onChangeName,
  onPlayCasual,
  onOpenCompetitive,
  onCreatePrivateRoom,
  onJoinRoomByCode,
  onViewLeaderboard,
  onViewRooms,
  onJumpIntoFeatured,
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [styleIndex, setStyleIndex] = useState(0);
  const [hatIndex, setHatIndex] = useState(1);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTopPlayers(data.slice(0, 3));
        }
      })
      .catch(() => {})
      .finally(() => setLeaderboardLoading(false));
  }, []);

  // Surprise Me / Randomize Everything
  const handleRandomize = () => {
    sound.playClick();
    const randStyle = AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];
    const randHat = AVATAR_HATS[Math.floor(Math.random() * AVATAR_HATS.length)];
    const randColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const randName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];

    onChangeAvatar({ style: randStyle, hat: randHat, color: randColor });
    onChangeName(randName);
  };

  const handleNextHat = () => {
    sound.playClick();
    const nextIdx = (hatIndex + 1) % AVATAR_HATS.length;
    setHatIndex(nextIdx);
    onChangeAvatar({ ...userAvatar, hat: AVATAR_HATS[nextIdx] });
  };

  const handlePrevHat = () => {
    sound.playClick();
    const prevIdx = (hatIndex - 1 + AVATAR_HATS.length) % AVATAR_HATS.length;
    setHatIndex(prevIdx);
    onChangeAvatar({ ...userAvatar, hat: AVATAR_HATS[prevIdx] });
  };

  const handleRollName = () => {
    sound.playClick();
    const randName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    onChangeName(randName);
  };

  const handlePasteCode = async () => {
    sound.playClick();
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRoomCodeInput(text.toUpperCase().trim());
      }
    } catch (e) {}
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    sound.playClick();
    onJoinRoomByCode(roomCodeInput.trim());
  };

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-10">
      {/* HERO SECTION: THE PLAY HUB & AVATAR WORKSHOP */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* HERO CARD 1: Character Lab & Customizer (5 Cols) */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-3xl p-6 sm:p-8 tactile-card flex flex-col justify-between relative overflow-hidden">
          {/* Playful Background Accents */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-surface-container-high rounded-full blur-2xl pointer-events-none opacity-60"></div>
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-primary-fixed-dim rounded-full blur-2xl pointer-events-none opacity-40"></div>

          <div>
            {/* Title & Level Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="inline-block px-3 py-1 bg-surface-container-high text-primary font-bold text-xs rounded-full uppercase tracking-wider mb-1">
                  Doodler Identity
                </span>
                <h2 className="font-headline-md text-xl sm:text-2xl font-bold text-on-surface">
                  Your Battle Persona
                </h2>
              </div>
              <button
                type="button"
                onClick={handleRandomize}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-highest text-primary font-bold text-xs transition-all active:scale-95"
                title="Randomize Everything"
              >
                <span className="material-symbols-outlined text-base">casino</span>
                <span>Surprise Me</span>
              </button>
            </div>

            {/* Avatar Stage Carousel */}
            <div className="flex flex-col items-center justify-center my-4 py-6 bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant relative">
              {/* Stage Ring */}
              <div className="relative p-2 mb-4 group transition-transform duration-300 hover:scale-105">
                <PlayerAvatar
                  style={userAvatar.style}
                  hat={userAvatar.hat}
                  color={userAvatar.color}
                  size="2xl"
                  showDrawingBadge={true}
                />
              </div>

              {/* Avatar Part Selector Dots (Hats, Colors) */}
              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={handlePrevHat}
                  className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90"
                  title="Previous Hat"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>

                {/* Color chips */}
                <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1 rounded-full border border-outline-variant">
                  {AVATAR_COLORS.slice(0, 4).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onChangeAvatar({ ...userAvatar, color: c })}
                      className={`w-3.5 h-3.5 rounded-full transition-transform ${
                        userAvatar.color === c ? 'ring-2 ring-primary scale-125' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleNextHat}
                  className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90"
                  title="Next Hat"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Nickname Input with instant dice roll */}
            <div className="mt-6">
              <label className="block text-xs font-bold text-on-surface mb-2">
                Nickname / Tag
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-xl">badge</span>
                  </div>
                  <input
                    type="text"
                    maxLength={16}
                    value={userName}
                    onChange={(e) => onChangeName(e.target.value)}
                    placeholder="Your Doodler Name"
                    className="w-full pl-11 pr-10 py-3 bg-surface-container-low border-2 border-outline-variant focus:border-primary focus:bg-surface-container-lowest rounded-2xl font-bold text-base text-on-surface transition-all outline-none"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-600 font-bold">
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRollName}
                  className="h-[48px] w-[48px] tactile-btn-ghost rounded-2xl flex items-center justify-center text-primary"
                  title="Roll Random Nickname"
                >
                  <span className="material-symbols-outlined text-2xl">restart_alt</span>
                </button>
              </div>
              <p className="text-[11px] text-outline mt-2 flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-sm text-emerald-600">
                  verified_user
                </span>
                Valid family-friendly nickname. Visible to all players.
              </p>
            </div>
          </div>

          {/* Room Code Quick Pass */}
          <div className="mt-8 pt-5 border-t-2 border-outline-variant">
            <label className="block text-xs font-bold text-on-surface mb-2">
              Have a Private Invite Code?
            </label>
            <form onSubmit={handleJoinByCode} className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                  <span className="material-symbols-outlined text-lg">key</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. #ROAR-409"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2.5 bg-surface-container-low border-2 border-outline-variant rounded-xl text-xs font-bold uppercase tracking-wider text-on-surface focus:border-primary outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handlePasteCode}
                className="tactile-btn-ghost px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">content_paste</span>
                <span>Paste</span>
              </button>
              <button
                type="submit"
                className="tactile-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold text-white"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* HERO CARD 2: Arena Launch Deck & Modes (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-6">
          {/* Big Chunky Primary Action Deck */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 tactile-card flex flex-col gap-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-fixed text-on-primary-fixed text-xs rounded-full font-extrabold uppercase">
                  <span className="material-symbols-outlined text-xs fill-icon">bolt</span>
                  Instant Matchmaking v2.4
                </span>
                <h1 className="font-headline-xl text-3xl sm:text-4xl text-on-surface mt-1 font-black tracking-tight">
                  Ready to Doodle?
                </h1>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant self-start sm:self-auto">
                <span className="material-symbols-outlined text-primary text-base">speed</span>
                <span className="text-xs font-bold text-on-surface">Avg. queue: Instant</span>
              </div>
            </div>

            {/* PRIMARY 3D CTA BUTTON: CASUAL QUICK PLAY */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onPlayCasual();
              }}
              className="w-full group tactile-btn-primary py-5 px-6 sm:px-8 rounded-2xl flex items-center justify-between text-white shadow-[0_12px_28px_-4px_rgba(124,58,237,0.35)] transition-all"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">play_arrow</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline-lg text-xl sm:text-2xl font-black tracking-tight">
                      PLAY CASUAL
                    </span>
                    <span className="bg-amber-300 text-on-background px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                      Popular
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-on-primary-container font-semibold mt-0.5">
                    Drop instantly into an open table • 8 Players • No pressure
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-3xl group-hover:translate-x-1.5 transition-transform">
                arrow_forward
              </span>
            </button>

            {/* SECONDARY DUAL BUTTONS: RANKED ARENA & PRIVATE ROOM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* COMPETITIVE ARENA */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onOpenCompetitive();
                }}
                className="tactile-card bg-gradient-to-br from-surface-container-lowest to-surface-container-low p-5 rounded-2xl text-left flex flex-col justify-between group hover:border-primary transition-all active:translate-y-1"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-2xl fill-icon">
                      military_tech
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                    TIER GOLD II
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                    Competitive Arena
                  </h3>
                  <p className="text-xs text-outline mt-1 font-medium">
                    Stricter timers, anti-cheat masks, and Ranked ELO points.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-bold text-primary">
                  <span>Enter Queue</span>
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                    chevron_right
                  </span>
                </div>
              </button>

              {/* CREATE PRIVATE ROOM */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onCreatePrivateRoom();
                }}
                className="tactile-card bg-gradient-to-br from-surface-container-lowest to-surface-container-low p-5 rounded-2xl text-left flex flex-col justify-between group hover:border-secondary-container transition-all active:translate-y-1"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-secondary flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-2xl">meeting_room</span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-rose-200 text-secondary border border-rose-300">
                    CUSTOM
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface group-hover:text-secondary transition-colors">
                    Create Private Room
                  </h3>
                  <p className="text-xs text-outline mt-1 font-medium">
                    Custom word packs, customized round clocks, host rules.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-bold text-secondary">
                  <span>Setup Table</span>
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                    chevron_right
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* LIVE PUBLIC ROOMS TICKER BANNER */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 tactile-card flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
              <div>
                <p className="text-sm font-bold text-on-surface leading-tight">
                  Featured Public Lobby: #PARTY-ANIMALS
                </p>
                <p className="text-xs text-outline font-medium">
                  Custom Pack: 90s Cartoons • 6/8 Players Joined
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onJumpIntoFeatured();
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface-container-high hover:bg-primary hover:text-white text-primary font-bold text-xs transition-all active:translate-y-0.5"
            >
              Spectate / Jump In
            </button>
          </div>
        </div>
      </section>

      {/* SECTION: FEATURED GAME MODES (Bento Layout) */}
      <section>
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-black text-primary uppercase tracking-wider">
              Diverse Experiences
            </span>
            <h2 className="font-headline-lg text-2xl font-black text-on-surface mt-1">
              Featured Game Modes
            </h2>
          </div>
          <button
            onClick={onViewRooms}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>View All Public Rooms</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Mode 1: Classic Doodle */}
          <div
            onClick={onPlayCasual}
            className="tactile-card bg-surface-container-lowest rounded-3xl p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-12 h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-2xl">palette</span>
                </span>
                <span className="text-[10px] bg-primary-container text-white px-2.5 py-1 rounded-full font-bold">
                  6.4k Playing
                </span>
              </div>
              <h3 className="font-headline-md text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                Classic Doodle
              </h3>
              <p className="text-xs text-outline mt-2 leading-relaxed font-medium">
                Standard 80s round timer. Pick 1 of 3 random curated words. Pure drawing intuition and quick guessing.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-between text-xs font-bold text-outline">
              <span>Round: 80s</span>
              <span className="text-primary font-bold">Play Now →</span>
            </div>
          </div>

          {/* Mode 2: Speed Rush 45s */}
          <div
            onClick={onPlayCasual}
            className="tactile-card bg-surface-container-lowest rounded-3xl p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-12 h-12 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-2xl">alarm</span>
                </span>
                <span className="text-[10px] bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full font-bold">
                  FAST PACED
                </span>
              </div>
              <h3 className="font-headline-md text-lg font-bold text-on-surface group-hover:text-secondary transition-colors">
                Speed Rush 45s
              </h3>
              <p className="text-xs text-outline mt-2 leading-relaxed font-medium">
                Cut the time in half! Zero hesitation allowed. High tension, rapid fire guesses, double score multipliers.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-between text-xs font-bold text-outline">
              <span>Round: 45s</span>
              <span className="text-secondary font-bold">Play Now →</span>
            </div>
          </div>

          {/* Mode 3: Custom Word Fiesta */}
          <div
            onClick={onCreatePrivateRoom}
            className="tactile-card bg-surface-container-lowest rounded-3xl p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-2xl">auto_stories</span>
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full font-bold">
                  COMMUNITY
                </span>
              </div>
              <h3 className="font-headline-md text-lg font-bold text-on-surface group-hover:text-amber-800 transition-colors">
                Word Fiesta
              </h3>
              <p className="text-xs text-outline mt-2 leading-relaxed font-medium">
                Play with hilarious theme packs: Anime, Tech Memes, 90s Nostalgia, Video Games, or upload your custom JSON.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-between text-xs font-bold text-outline">
              <span>Packs: 120+</span>
              <span className="text-amber-800 font-bold">Browse →</span>
            </div>
          </div>

          {/* Mode 4: Team Sketch Duel */}
          <div
            onClick={onOpenCompetitive}
            className="tactile-card bg-surface-container-lowest rounded-3xl p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-2xl">diversity_3</span>
                </span>
                <span className="text-[10px] bg-teal-100 text-teal-900 px-2.5 py-1 rounded-full font-bold">
                  4 vs 4
                </span>
              </div>
              <h3 className="font-headline-md text-lg font-bold text-on-surface group-hover:text-teal-800 transition-colors">
                Team Duel
              </h3>
              <p className="text-xs text-outline mt-2 leading-relaxed font-medium">
                Two drawers simultaneously sketch complementary halves of a compound word. Pure chaotic teamwork.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-between text-xs font-bold text-outline">
              <span>Red vs Blue</span>
              <span className="text-teal-800 font-bold">Join Duel →</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: HOW TO PLAY IN 3 SIMPLE STEPS */}
      <section className="bg-surface-container-low rounded-3xl p-8 border-2 border-outline-variant">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-extrabold text-primary uppercase tracking-widest">
            New to Doodle Arena?
          </span>
          <h2 className="font-headline-xl text-2xl sm:text-3xl font-black text-on-surface mt-1">
            How It Works in 3 Steps
          </h2>
          <p className="text-xs sm:text-sm text-outline mt-1 font-medium">
            Zero software to install, no accounts required. Pure browser multiplayer in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="bg-surface-container-lowest rounded-2xl p-6 tactile-card flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl mb-3 shadow-md">
              1
            </div>
            <h3 className="font-headline-md text-base font-bold text-on-surface mb-1">
              Pick a Secret Word
            </h3>
            <p className="text-xs text-outline font-medium">
              When it's your turn in the spotlight, pick 1 of 3 mystery words ranging from Easy to Ultra-Hilarious.
            </p>
            <div className="mt-4 px-3 py-1.5 rounded-lg bg-surface-container text-xs font-bold text-primary">
              Example: "ASTRONAUT DANCING"
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 tactile-card flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl mb-3 shadow-md">
              2
            </div>
            <h3 className="font-headline-md text-base font-bold text-on-surface mb-1">
              Draw Like Crazy
            </h3>
            <p className="text-xs text-outline font-medium">
              Unleash your inner artist with responsive brush sizes, bucket fills, color swatches, and quick undo gestures.
            </p>
            <div className="mt-4 px-3 py-1.5 rounded-lg bg-surface-container text-xs font-bold text-secondary">
              Strict Rule: No Letters or Digits!
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 tactile-card flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl mb-3 shadow-md">
              3
            </div>
            <h3 className="font-headline-md text-base font-bold text-on-surface mb-1">
              Guess & Climb Roster
            </h3>
            <p className="text-xs text-outline font-medium">
              Type your wild guesses in the live chat log. The faster you solve it, the higher bonus points you bank!
            </p>
            <div className="mt-4 px-3 py-1.5 rounded-lg bg-emerald-100 text-xs font-bold text-emerald-800">
              Winner takes the Golden Crown!
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: GLOBAL TOP DOODLERS MINI-LEADERBOARD & COMMUNITY TICKER */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-6">
        {/* Mini Leaderboard (7 Cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-3xl p-6 sm:p-7 tactile-card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <span className="material-symbols-outlined fill-icon text-2xl">trophy</span>
              </div>
              <div className="text-left">
                <h3 className="font-headline-md text-lg font-bold text-on-surface">
                  Weekly Top Doodlers
                </h3>
                <p className="text-xs text-outline font-medium">Resets in 2 days, 14 hours</p>
              </div>
            </div>
            <button
              onClick={onViewLeaderboard}
              className="tactile-btn-ghost px-3.5 py-1.5 rounded-xl text-xs text-primary font-bold"
            >
              Full Leaderboard
            </button>
          </div>

          <div className="space-y-3">
            {leaderboardLoading ? (
              <div className="p-8 text-center text-outline text-xs font-bold animate-pulse">
                Loading weekly leaderboards...
              </div>
            ) : topPlayers.length === 0 ? (
              <div className="p-6 rounded-2xl bg-surface-container-low border-2 border-dashed border-outline-variant flex flex-col items-center text-center gap-2">
                <span className="material-symbols-outlined text-3xl text-primary">emoji_events</span>
                <span className="font-extrabold text-sm text-on-surface">No Ranked Matches Recorded This Week</span>
                <p className="text-xs text-outline max-w-xs font-medium">
                  Be the first to jump into a casual or competitive match and claim Rank #1 on the leaderboard!
                </p>
              </div>
            ) : (
              topPlayers.map((player, idx) => {
                const rankColors = [
                  { bg: 'bg-amber-50/70', border: 'border-amber-200', badge: 'bg-amber-400', text: 'text-amber-900', label: 'CHAMPION' },
                  { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-300', text: 'text-slate-700', label: 'RUNNER UP' },
                  { bg: 'bg-orange-50/60', border: 'border-orange-200', badge: 'bg-amber-700 text-white', text: 'text-amber-900', label: 'BRONZE' },
                ][idx] || { bg: 'bg-surface-container-low', border: 'border-outline-variant', badge: 'bg-surface-container-high', text: 'text-on-surface', label: `#${idx + 1}` };

                const winRate = player.totalGames > 0 ? ((player.totalWins / player.totalGames) * 100).toFixed(1) : '100.0';

                return (
                  <div
                    key={player.id || idx}
                    className={`flex items-center justify-between p-3.5 rounded-2xl ${rankColors.bg} border ${rankColors.border}`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-7 h-7 rounded-full ${rankColors.badge} font-black text-xs flex items-center justify-center shadow-sm`}>
                        {idx + 1}
                      </div>
                      <PlayerAvatar
                        style={player.avatarStyle || 'cat'}
                        hat={player.avatarHat || 'none'}
                        color={player.avatarColor || '#7C3AED'}
                        size="md"
                      />
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-on-surface">{player.nickname || player.name}</span>
                          <span className="bg-primary/10 text-primary text-[10px] font-black px-1.5 py-0.5 rounded">
                            {player.rankTier || rankColors.label}
                          </span>
                        </div>
                        <span className="text-xs text-outline font-medium">
                          {player.totalWins || 0} Wins • {winRate}% Accuracy
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-headline-md text-lg font-black ${rankColors.text}`}>
                        {(player.xp || player.score || 0).toLocaleString()}
                      </span>
                      <span className="block text-[10px] font-bold text-outline">PTS</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Community Spotlight (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-primary to-primary-container text-white rounded-3xl p-6 sm:p-7 shadow-[0_12px_28px_-4px_rgba(124,58,237,0.25)] flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Community Spotlight
              </span>
              <span className="material-symbols-outlined text-2xl text-amber-300 fill-icon">
                auto_awesome
              </span>
            </div>
            <h3 className="font-headline-lg text-2xl font-black tracking-tight leading-tight">
              Word of the Day: "Rollercoaster"
            </h3>
            <p className="text-xs text-on-primary-container font-medium mt-2 leading-relaxed">
              Today's Curated Challenge! Pro tip: Start with the loopy tracks before sketching the tiny cheering passengers.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between">
            <span className="text-xs text-white/80 font-bold">120+ Curated Words</span>
            <button
              onClick={onCreatePrivateRoom}
              className="px-4 py-2 rounded-xl bg-white text-primary font-bold text-xs hover:bg-white/90 transition-all shadow-sm"
            >
              Try in Custom Room →
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};
