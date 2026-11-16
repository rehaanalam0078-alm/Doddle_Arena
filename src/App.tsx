import React, { useState, useEffect, useRef } from 'react';
import { socketService } from '@/services/socket';
import { sound } from '@/services/sound';
import {
  RoomState,
  Stroke,
  ChatMessage,
  WordOption,
  DrawingTool,
  PlayerAvatar as IPlayerAvatar,
  Tournament,
} from '@/types/game';

// Components & Views
import { AppHeader } from '@/components/common/AppHeader';
import { MainLobbyView } from '@/views/MainLobbyView';
import { RoomLobbyView } from '@/views/RoomLobbyView';
import { DrawerView } from '@/views/DrawerView';
import { GuesserView } from '@/views/GuesserView';
import { ScoreboardView } from '@/views/ScoreboardView';
import { CompetitiveArenaView } from '@/views/CompetitiveArenaView';
import { TournamentView } from '@/views/TournamentView';
import { SpectatorView } from '@/views/SpectatorView';
import { LeaderboardView } from '@/views/LeaderboardView';
import { RoomsDirectoryView } from '@/views/RoomsDirectoryView';
import { ShopView } from '@/views/ShopView';
import { WordlistEditorView } from '@/views/WordlistEditorView';

// Modals
import { CreateRoomModal } from '@/components/modals/CreateRoomModal';
import { InviteModal } from '@/components/modals/InviteModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { ProfileModal } from '@/components/modals/ProfileModal';
import { RulesHelpModal } from '@/components/modals/RulesHelpModal';
import { WordSelectionModal } from '@/components/modals/WordSelectionModal';

export const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<string>('lobby');

  // Player Identity State (truthful initial guest session)
  const [userName, setUserName] = useState<string>(() => {
    const saved = localStorage.getItem('doodle_player_name');
    if (saved) return saved;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newGuest = `Guest_${randomSuffix}`;
    localStorage.setItem('doodle_player_name', newGuest);
    return newGuest;
  });
  const [userAvatar, setUserAvatar] = useState<IPlayerAvatar>(() => {
    const saved = localStorage.getItem('doodle_player_avatar');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { style: 'cat', hat: 'beret', color: '#7C3AED' };
  });

  const [userLevel, setUserLevel] = useState<number>(() => {
    const saved = localStorage.getItem('doodle_player_level');
    return saved ? Math.max(1, parseInt(saved, 10)) : 1;
  });
  const [userXp, setUserXp] = useState<number>(() => {
    const saved = localStorage.getItem('doodle_player_xp');
    return saved ? Math.max(0, parseInt(saved, 10)) : 0;
  });
  const [userElo, setUserElo] = useState<number>(() => {
    const saved = localStorage.getItem('doodle_player_elo');
    return saved ? Math.max(0, parseInt(saved, 10)) : 1000;
  });
  const [userRankTier, setUserRankTier] = useState<string>(() => {
    const saved = localStorage.getItem('doodle_player_rank');
    return saved || 'Unranked';
  });
  const [onlineCount, setOnlineCount] = useState<number>(1);

  // Active Multiplayer Room State
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [currentSocketId, setCurrentSocketId] = useState<string>('');
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [isSpectatorMode, setIsSpectatorMode] = useState<boolean>(false);
  const currentTurnIdRef = useRef<string | null>(null);

  // Drawing Canvas State
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentTool, setCurrentTool] = useState<DrawingTool>('brush');
  const [currentColor, setCurrentColor] = useState<string>('#1E1B4B');
  const [currentBrushSize, setCurrentBrushSize] = useState<number>(8);

  // Gameplay Word Options & Chat Feed
  const [wordOptions, setWordOptions] = useState<WordOption[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Modals Visibility
  const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Competitive & Tournament State
  const [isRankedQueued, setIsRankedQueued] = useState(false);
  const [queuePosition, setQueuePosition] = useState(1);
  const [tournamentData, setTournamentData] = useState<Tournament | null>(null);

  // Save guest player preferences to localStorage
  useEffect(() => {
    localStorage.setItem('doodle_player_name', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('doodle_player_avatar', JSON.stringify(userAvatar));
  }, [userAvatar]);

  // Connect to Socket.IO Backend Server
  useEffect(() => {
    const socket = socketService.connect();

    socket.on('session:init', (data: { socketId: string }) => {
      setCurrentSocketId(data.socketId);
    });

    socket.on('room:state', (state: RoomState) => {
      setRoomState(state);

      // Canvas lifecycle: wipe strokes when a new turn begins or during word selection
      if (state.turnId && state.turnId !== currentTurnIdRef.current) {
        currentTurnIdRef.current = state.turnId;
        setStrokes([]);
      } else if (state.phase === 'WORD_SELECTION' || state.phase === 'LOBBY') {
        setStrokes([]);
      }

      // Identify our player ID in the room
      const me = state.players.find((p) => p.socketId === socket.id);
      if (me) {
        setCurrentPlayerId(me.id);
      }

      // Auto-route based on gameplay phase if active in room
      if (state.phase === 'LOBBY') {
        setCurrentView('room_lobby');
      } else if (state.phase === 'DRAWING' || state.phase === 'WORD_SELECTION' || state.phase === 'ROUND_RESULT') {
        if (me && me.id === state.currentDrawerId) {
          setCurrentView('drawer');
        } else if (!isSpectatorMode) {
          setCurrentView('guesser');
        }
      } else if (state.phase === 'MATCH_RESULT') {
        setCurrentView('scoreboard');
      }
    });

    socket.on('drawing:turnStart', (data: { turnId: string; drawerId: string; strokes?: Stroke[] }) => {
      currentTurnIdRef.current = data.turnId;
      setStrokes(data.strokes || []);
    });

    socket.on('word:options', (data: { options: WordOption[] }) => {
      setWordOptions(data.options);
      sound.playRoundStart();
    });

    socket.on('drawing:stroke', (stroke: Stroke) => {
      // Discard stroke if it belongs to an expired turn
      if (stroke.turnId && currentTurnIdRef.current && stroke.turnId !== currentTurnIdRef.current) {
        return;
      }
      setStrokes((prev) => [...prev, stroke]);
    });

    socket.on('drawing:undo', ({ strokeId }: { strokeId: string }) => {
      setStrokes((prev) => prev.filter((s) => s.id !== strokeId));
    });

    socket.on('drawing:redo', ({ stroke }: { stroke: Stroke }) => {
      setStrokes((prev) => [...prev, stroke]);
    });

    socket.on('drawing:cleared', () => {
      setStrokes([]);
    });

    socket.on('drawing:snapshot', ({ strokes: snapStrokes }: { strokes: Stroke[] }) => {
      setStrokes(snapStrokes || []);
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.type === 'correct') {
        sound.playCorrect();
      } else if (msg.type === 'close') {
        sound.playClose();
      }
    });

    socket.on('guess:success', (data: { points: number; word: string }) => {
      sound.playCorrect();
      setUserXp((prev) => {
        const newXp = prev + data.points;
        try {
          localStorage.setItem('doodle_player_xp', String(newXp));
          const newLevel = Math.floor(newXp / 500) + 1;
          setUserLevel(newLevel);
          localStorage.setItem('doodle_player_level', String(newLevel));
        } catch (e) {}
        return newXp;
      });
    });

    socket.on('guess:close', (data: { message: string }) => {
      sound.playClose();
    });

    socket.on('ranked:queueStatus', (data: { status: string; position: number }) => {
      if (data.status === 'queued') {
        setIsRankedQueued(true);
        setQueuePosition(data.position || 1);
      } else {
        setIsRankedQueued(false);
      }
    });

    socket.on('ranked:matchFound', (data: { roomCode: string }) => {
      setIsRankedQueued(false);
      sound.playRoundStart();
    });

    // Fetch initial tournament data
    fetch('/api/tournament')
      .then((res) => res.json())
      .then((data) => setTournamentData(data))
      .catch((e) => console.warn('Tournament fetch note', e));

    return () => {
      socket.off('session:init');
      socket.off('room:state');
      socket.off('drawing:turnStart');
      socket.off('word:options');
      socket.off('drawing:stroke');
      socket.off('drawing:undo');
      socket.off('drawing:redo');
      socket.off('drawing:cleared');
      socket.off('drawing:snapshot');
      socket.off('chat:message');
      socket.off('guess:success');
      socket.off('guess:close');
      socket.off('ranked:queueStatus');
      socket.off('ranked:matchFound');
    };
  }, [isSpectatorMode]);

  // Periodic health check for truthful live online artists count
  useEffect(() => {
    const fetchHealth = () => {
      fetch('/api/health')
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.onlineArtists === 'number') {
            setOnlineCount(data.onlineArtists);
          }
        })
        .catch(() => {});
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // --- Actions ---

  const handlePlayCasual = () => {
    setIsSpectatorMode(false);
    setStrokes([]);
    setMessages([]);
    socketService.createRoom(userName, userAvatar, {
      isPrivate: false,
      rounds: 3,
      drawTimeSeconds: 80,
    });
  };

  const handleCreatePrivateRoom = (settings?: any, customCode?: string) => {
    setIsSpectatorMode(false);
    setStrokes([]);
    setMessages([]);
    socketService.createRoom(userName, userAvatar, settings, customCode);
  };

  const handleJoinRoom = (code: string) => {
    setIsSpectatorMode(false);
    setStrokes([]);
    setMessages([]);
    socketService.joinRoom(code, userName, userAvatar);
  };

  const handleSpectateRoom = (code: string) => {
    setIsSpectatorMode(true);
    setStrokes([]);
    setMessages([]);
    socketService.joinSpectator(code);
    setCurrentView('spectator');
  };

  const handleLeaveRoom = () => {
    sound.playClick();
    setRoomState(null);
    setStrokes([]);
    setMessages([]);
    setIsSpectatorMode(false);
    setCurrentView('lobby');
  };

  const handleEmitStroke = (stroke: Stroke) => {
    const scopedStroke: Stroke = {
      ...stroke,
      turnId: roomState?.turnId,
    };
    setStrokes((prev) => [...prev, scopedStroke]);
    if (roomState) {
      socketService.sendStroke(roomState.code, scopedStroke);
    }
  };

  const handleUndo = () => {
    if (strokes.length > 0 && roomState) {
      socketService.sendUndo(roomState.code);
    }
  };

  const handleRedo = () => {
    if (roomState) {
      socketService.sendRedo(roomState.code);
    }
  };

  const handleClear = () => {
    if (roomState) {
      socketService.sendClear(roomState.code);
    }
  };

  const handleSelectWord = (word: string) => {
    if (roomState) {
      socketService.selectWord(roomState.code, word);
      setWordOptions([]);
    }
  };

  const handleVoteRematch = () => {
    if (roomState) {
      socketService.voteRematch(roomState.code);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      {/* Top App Header */}
      <AppHeader
        currentView={currentView}
        onNavigate={(view) => {
          sound.playClick();
          setCurrentView(view);
        }}
        onlineCount={onlineCount}
        userAvatar={userAvatar}
        userName={userName}
        userLevel={userLevel}
        userXp={userXp}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenHelp={() => setHelpModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      {/* Main View Router */}
      <div className="flex-1 flex flex-col">
        {/* SCREEN 01: Main Lobby */}
        {currentView === 'lobby' && (
          <MainLobbyView
            userAvatar={userAvatar}
            onChangeAvatar={setUserAvatar}
            userName={userName}
            onChangeName={setUserName}
            onPlayCasual={handlePlayCasual}
            onOpenCompetitive={() => setCurrentView('competitive')}
            onCreatePrivateRoom={() => setCreateRoomModalOpen(true)}
            onJoinRoomByCode={handleJoinRoom}
            onViewLeaderboard={() => setCurrentView('leaderboard')}
            onViewRooms={() => setCurrentView('rooms')}
            onJumpIntoFeatured={() => handleSpectateRoom('PARTY-ANIMALS')}
          />
        )}

        {/* SCREEN 02: Multiplayer Room Lobby */}
        {currentView === 'room_lobby' && roomState && (
          <RoomLobbyView
            room={roomState}
            currentPlayerId={currentPlayerId}
            onSetReady={(isReady) => socketService.setReady(roomState.code, isReady)}
            onStartGame={() => socketService.startGame(roomState.code)}
            onLeaveRoom={handleLeaveRoom}
            onUpdateSettings={(settings) => socketService.updateSettings(roomState.code, settings)}
            onSendMessage={(text) => socketService.sendChatMessage(roomState.code, text)}
            onOpenInvite={() => setInviteModalOpen(true)}
            onOpenWordlistEditor={() => setCurrentView('wordlist_editor')}
          />
        )}

        {/* SCREEN 03: Gameplay Drawer View */}
        {currentView === 'drawer' && roomState && (
          <DrawerView
            room={roomState}
            currentPlayerId={currentPlayerId}
            strokes={strokes}
            messages={messages}
            currentTool={currentTool}
            currentColor={currentColor}
            currentBrushSize={currentBrushSize}
            onSelectTool={setCurrentTool}
            onSelectColor={setCurrentColor}
            onSelectBrushSize={setCurrentBrushSize}
            onEmitStroke={handleEmitStroke}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClear}
            onLeaveGame={handleLeaveRoom}
          />
        )}

        {/* SCREEN 04: Gameplay Guesser View */}
        {currentView === 'guesser' && roomState && (
          <GuesserView
            room={roomState}
            currentPlayerId={currentPlayerId}
            strokes={strokes}
            messages={messages}
            onSubmitGuess={(guess) => socketService.sendGuess(roomState.code, guess)}
            onLikeArtwork={() =>
              socketService.sendArtworkLike(roomState.code, roomState.currentRound)
            }
            onLeaveGame={handleLeaveRoom}
          />
        )}

        {/* SCREEN 05: Final Scoreboard & Podium Celebration */}
        {currentView === 'scoreboard' && roomState && (
          <ScoreboardView
            room={roomState}
            currentPlayerId={currentPlayerId}
            onVoteRematch={handleVoteRematch}
            onReturnToLobby={handleLeaveRoom}
          />
        )}

        {/* SCREEN 06: Competitive Arena & Ranked Hub */}
        {currentView === 'competitive' && (
          <CompetitiveArenaView
            isQueued={isRankedQueued}
            queuePosition={queuePosition}
            onQueueRanked={() =>
              socketService.queueRanked(currentPlayerId || 'guest', userName, userElo)
            }
            onCancelQueue={() => socketService.cancelRankedQueue()}
            onNavigateToTournaments={() => setCurrentView('tournament')}
            onNavigateToLobby={() => setCurrentView('lobby')}
          />
        )}

        {/* SCREEN 07: Tournament Bracket & Match Schedule */}
        {currentView === 'tournament' && tournamentData && (
          <TournamentView
            tournament={tournamentData}
            onSpectateMatch={(code) => handleSpectateRoom(code)}
            onNavigateToCompetitive={() => setCurrentView('competitive')}
            onNavigateToLobby={() => setCurrentView('lobby')}
          />
        )}

        {/* SCREEN 08: Spectator Live View & Stream */}
        {currentView === 'spectator' && roomState && (
          <SpectatorView
            room={roomState}
            strokes={strokes}
            messages={messages}
            onSendSpectatorReaction={(reaction) =>
              socketService.sendSpectatorReaction(roomState.code, reaction)
            }
            onSendChatMessage={(text) => socketService.sendChatMessage(roomState.code, text)}
            onLeaveGame={handleLeaveRoom}
          />
        )}

        {/* Full Leaderboard View */}
        {currentView === 'leaderboard' && (
          <LeaderboardView onBackToLobby={() => setCurrentView('lobby')} />
        )}

        {/* Public Rooms Directory */}
        {currentView === 'rooms' && (
          <RoomsDirectoryView
            onJoinRoom={handleJoinRoom}
            onSpectateRoom={handleSpectateRoom}
            onCreateRoom={() => setCreateRoomModalOpen(true)}
            onBackToLobby={() => setCurrentView('lobby')}
          />
        )}

        {/* Cosmetics & Perks Shop */}
        {currentView === 'shop' && (
          <ShopView userXp={userXp} onBackToLobby={() => setCurrentView('lobby')} />
        )}

        {/* Custom Wordpack Studio */}
        {currentView === 'wordlist_editor' && (
          <WordlistEditorView
            onBack={() => {
              if (roomState) {
                setCurrentView('room_lobby');
              } else {
                setCurrentView('lobby');
              }
            }}
          />
        )}
      </div>

      {/* Drawer Word Selection Overlay Modal */}
      {roomState &&
        roomState.phase === 'WORD_SELECTION' &&
        currentPlayerId === roomState.currentDrawerId &&
        wordOptions.length > 0 && (
          <WordSelectionModal
            options={wordOptions}
            onSelectWord={handleSelectWord}
            durationSeconds={15}
          />
        )}

      {/* Aux Modals */}
      <CreateRoomModal
        isOpen={createRoomModalOpen}
        onClose={() => setCreateRoomModalOpen(false)}
        onCreateRoom={handleCreatePrivateRoom}
      />

      <InviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        roomCode={roomState?.code || 'ROAR-409'}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        avatar={userAvatar}
        name={userName}
        level={userLevel}
        xp={userXp}
        elo={userElo}
        rankTier={userRankTier}
      />

      <RulesHelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </div>
  );
};
export default App;
