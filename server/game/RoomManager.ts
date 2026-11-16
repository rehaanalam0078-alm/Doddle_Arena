import { Server, Socket } from 'socket.io';
import {
  Player,
  RoomSettings,
  GamePhase,
  RoomState,
  Stroke,
  WordOption,
  ChatMessage,
  ArtworkRecord,
  PlayerAvatar,
} from '../../shared/types.js';
import { WordService } from './WordService.js';
import { GuessService } from './GuessService.js';
import { ScoringService } from './ScoringService.js';
import { db } from '../db/Database.js';
import { BotDrawingEngine } from './BotDrawingEngine.js';
import type { VoiceManager } from '../voice/VoiceManager.js';

export interface InternalRoom {
  code: string;
  hostId: string;
  settings: RoomSettings;
  players: Map<string, Player>; // playerId -> Player
  socketToPlayerId: Map<string, string>; // socketId -> playerId
  spectatorSocketIds: Set<string>;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  turnId: string;
  isEndingRound?: boolean;
  selectionTimeout?: NodeJS.Timeout | null;
  botDrawingTimeouts: NodeJS.Timeout[];
  drawerOrder: string[];
  drawerIndex: number;
  currentDrawerId: string | null;
  timerStart: number;
  timerEnd: number;
  durationSeconds: number;
  timerInterval: NodeJS.Timeout | null;
  secretWord: string;
  clue: string;
  category: string;
  difficultyPoints: number;
  wordOptions: WordOption[];
  strokes: Stroke[];
  undoneStrokes: Stroke[];
  roundGuesserScores: Map<string, number>; // playerId -> score
  messages: ChatMessage[];
  artworks: ArtworkRecord[];
  winnerId?: string;
  rematchVotes: Set<string>;
  createdAt: number;
}

export class RoomManager {
  private io: Server;
  private rooms: Map<string, InternalRoom> = new Map();
  public voiceManager?: VoiceManager;

  constructor(io: Server) {
    this.io = io;
  }

  public generateRoomCode(): string {
    const prefixes = ['ROAR', 'DRAW', 'DOODLE', 'SKETCH', 'MAGIC', 'TURBO'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${num}`;
  }

  public createRoom(
    hostSocket: Socket,
    playerName: string,
    avatar: PlayerAvatar,
    settings?: Partial<RoomSettings>,
    customCode?: string
  ): InternalRoom {
    const code = customCode ? customCode.toUpperCase() : this.generateRoomCode();
    const playerId = `ply_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const isPrivate = Boolean(settings?.isPrivate);
    const defaultSettings: RoomSettings = {
      isPrivate,
      maxPlayers: 8,
      rounds: 3,
      drawTimeSeconds: 80,
      difficulty: 'medium',
      wordPackId: 'classic',
      language: 'en',
      voiceChatEnabled: isPrivate ? Boolean(settings?.voiceChatEnabled) : false,
      ...settings,
    };

    // Strict constraint: voice chat is exclusively permitted in private rooms
    if (!defaultSettings.isPrivate) {
      defaultSettings.voiceChatEnabled = false;
    }

    const hostPlayer: Player = {
      id: playerId,
      socketId: hostSocket.id,
      name: playerName.trim() || 'SpeedyPencil',
      avatar,
      score: 0,
      rank: 1,
      isHost: true,
      isReady: true,
      isDrawing: false,
      hasGuessed: false,
    };

    const room: InternalRoom = {
      code,
      hostId: playerId,
      settings: defaultSettings,
      players: new Map([[playerId, hostPlayer]]),
      socketToPlayerId: new Map([[hostSocket.id, playerId]]),
      spectatorSocketIds: new Set(),
      phase: 'LOBBY',
      currentRound: 1,
      totalRounds: defaultSettings.rounds,
      turnId: `turn_${code}_r1_t0_${Date.now()}`,
      isEndingRound: false,
      selectionTimeout: null,
      botDrawingTimeouts: [],
      drawerOrder: [],
      drawerIndex: 0,
      currentDrawerId: null,
      timerStart: 0,
      timerEnd: 0,
      durationSeconds: defaultSettings.drawTimeSeconds,
      timerInterval: null,
      secretWord: '',
      clue: '',
      category: '',
      difficultyPoints: 100,
      wordOptions: [],
      strokes: [],
      undoneStrokes: [],
      roundGuesserScores: new Map(),
      messages: [],
      artworks: [],
      rematchVotes: new Set(),
      createdAt: Date.now(),
    };

    this.rooms.set(code, room);
    hostSocket.join(code);

    return room;
  }

  public joinRoom(
    socket: Socket,
    roomCode: string,
    playerName: string,
    avatar: PlayerAvatar
  ): { success: boolean; error?: string; room?: InternalRoom } {
    const cleanCode = roomCode.toUpperCase().replace('#', '').trim();
    const room = this.rooms.get(cleanCode);

    if (!room) {
      return { success: false, error: 'Room does not exist or has expired.' };
    }

    if (room.players.size >= room.settings.maxPlayers) {
      return { success: false, error: 'Room is currently full.' };
    }

    const playerId = `ply_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPlayer: Player = {
      id: playerId,
      socketId: socket.id,
      name: playerName.trim() || `Artist_${room.players.size + 1}`,
      avatar,
      score: 0,
      rank: room.players.size + 1,
      isHost: false,
      isReady: false,
      isDrawing: false,
      hasGuessed: false,
    };

    room.players.set(playerId, newPlayer);
    room.socketToPlayerId.set(socket.id, playerId);
    socket.join(cleanCode);

    this.broadcastSystemMessage(room, `${newPlayer.name} joined the room!`);
    this.broadcastRoomState(room);

    return { success: true, room };
  }

  public joinAsSpectator(
    socket: Socket,
    roomCode: string
  ): { success: boolean; error?: string; room?: InternalRoom } {
    const cleanCode = roomCode.toUpperCase().replace('#', '').trim();
    let room = this.rooms.get(cleanCode);

    // If room not found and it's a default/featured code, auto-create a mock live room for seamless demo
    if (!room) {
      room = this.createFeaturedDemoRoom(cleanCode);
    }

    room.spectatorSocketIds.add(socket.id);
    socket.join(cleanCode);

    this.broadcastSystemMessage(room, `A new spectator tuned in! (${room.spectatorSocketIds.size} watching)`);
    this.sendRoomStateToSocket(socket, room, true);

    return { success: true, room };
  }

  public getRoom(roomCode: string): InternalRoom | undefined {
    return this.rooms.get(roomCode.toUpperCase().replace('#', '').trim());
  }

  public getPublicRooms(): RoomState[] {
    return Array.from(this.rooms.values())
      .filter((r) => !r.settings.isPrivate)
      .map((r) => this.toClientRoomState(r, true));
  }

  public handleDisconnect(socket: Socket) {
    this.voiceManager?.handleLeave(socket);

    for (const room of this.rooms.values()) {
      // Check if spectator
      if (room.spectatorSocketIds.has(socket.id)) {
        room.spectatorSocketIds.delete(socket.id);
        continue;
      }

      // Check if player
      const playerId = room.socketToPlayerId.get(socket.id);
      if (playerId) {
        const player = room.players.get(playerId);
        if (player) {
          player.isDisconnected = true;
          this.broadcastSystemMessage(room, `${player.name} disconnected.`);

          // If in lobby, remove player immediately
          if (room.phase === 'LOBBY') {
            room.players.delete(playerId);
            room.socketToPlayerId.delete(socket.id);

            // Handle host transfer if host left
            if (room.hostId === playerId) {
              const remainingPlayers = Array.from(room.players.values());
              if (remainingPlayers.length > 0) {
                remainingPlayers[0].isHost = true;
                remainingPlayers[0].isReady = true;
                room.hostId = remainingPlayers[0].id;
                this.broadcastSystemMessage(
                  room,
                  `${remainingPlayers[0].name} is now the host.`
                );
              }
            }
          } else {
            // In game: if drawer disconnected, skip to next turn
            if (room.currentDrawerId === playerId && room.phase === 'DRAWING') {
              this.broadcastSystemMessage(
                room,
                `Drawer disconnected! Skipping turn...`
              );
              this.endRound(room, 'Drawer left the match');
            }
          }

          // If no active players remain in room, clean up after 5 minutes
          const activeCount = Array.from(room.players.values()).filter(
            (p) => !p.isDisconnected
          ).length;
          if (activeCount === 0) {
            if (room.timerInterval) clearInterval(room.timerInterval);
            this.rooms.delete(room.code);
          } else {
            this.broadcastRoomState(room);
          }
        }
        break;
      }
    }
  }

  public setPlayerReady(socket: Socket, roomCode: string, isReady: boolean) {
    const room = this.getRoom(roomCode);
    if (!room) return;
    const playerId = room.socketToPlayerId.get(socket.id);
    if (!playerId) return;

    const player = room.players.get(playerId);
    if (player) {
      player.isReady = isReady;
      this.broadcastRoomState(room);
    }
  }

  public updateRoomSettings(socket: Socket, roomCode: string, newSettings: Partial<RoomSettings>) {
    const room = this.getRoom(roomCode);
    if (!room) return;
    const playerId = room.socketToPlayerId.get(socket.id);
    if (playerId !== room.hostId) {
      socket.emit('error', 'Only the host can modify room settings.');
      return;
    }

    const mergedSettings: RoomSettings = { ...room.settings, ...newSettings };
    if (!mergedSettings.isPrivate) {
      mergedSettings.voiceChatEnabled = false;
    }

    const voiceWasDisabled = room.settings.voiceChatEnabled && !mergedSettings.voiceChatEnabled;
    room.settings = mergedSettings;
    room.totalRounds = room.settings.rounds;
    room.durationSeconds = room.settings.drawTimeSeconds;

    if (voiceWasDisabled) {
      this.voiceManager?.handleRoomVoiceToggled(room);
    }

    this.broadcastSystemMessage(room, `Room settings updated by host.`);
    this.broadcastRoomState(room);
  }

  // --- GAMEPLAY STATE MACHINE ---

  public startGame(socket: Socket, roomCode: string): { success: boolean; error?: string } {
    const room = this.getRoom(roomCode);
    if (!room) return { success: false, error: 'Room not found.' };

    const playerId = room.socketToPlayerId.get(socket.id);
    if (playerId !== room.hostId) {
      return { success: false, error: 'Only the room host can start the game.' };
    }

    if (room.players.size < 2) {
      // For testing, let's also allow 1 player with test bot if desired, but default rule requires 2
      // Let's create a simulated bot player if single-player testing is initiated
      if (room.players.size === 1) {
        const botId = `bot_${Date.now()}`;
        room.players.set(botId, {
          id: botId,
          socketId: 'bot_socket',
          name: 'DoodleBot_AI',
          avatar: { style: 'robot', hat: 'headphones', color: '#06B6D4' },
          score: 0,
          rank: 2,
          isHost: false,
          isReady: true,
          isDrawing: false,
          hasGuessed: false,
        });
        this.broadcastSystemMessage(room, 'DoodleBot_AI joined for duel match!');
      }
    }

    if (room.phase !== 'LOBBY' && room.phase !== 'MATCH_RESULT') {
      return { success: false, error: 'Game is already in progress.' };
    }

    // Initialize drawer rotation order
    room.drawerOrder = Array.from(room.players.keys());
    // Shuffle drawer order
    for (let i = room.drawerOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [room.drawerOrder[i], room.drawerOrder[j]] = [room.drawerOrder[j], room.drawerOrder[i]];
    }

    room.drawerIndex = 0;
    room.currentRound = 1;
    room.phase = 'COUNTDOWN';
    room.durationSeconds = 3;
    room.timerStart = Date.now();
    room.timerEnd = Date.now() + 3000;

    // Reset scores for all players
    for (const player of room.players.values()) {
      player.score = 0;
      player.isDrawing = false;
      player.hasGuessed = false;
    }

    this.broadcastSystemMessage(room, 'Game starting in 3 seconds!');
    this.broadcastRoomState(room);

    // After 3 seconds, start word selection
    setTimeout(() => {
      if (this.rooms.has(room.code)) {
        this.startWordSelection(room);
      }
    }, 3000);

    return { success: true };
  }

  private clearBotDrawing(room: InternalRoom) {
    if (room.botDrawingTimeouts && room.botDrawingTimeouts.length > 0) {
      for (const timeout of room.botDrawingTimeouts) {
        clearTimeout(timeout);
      }
      room.botDrawingTimeouts = [];
    }
  }

  private startBotDrawing(room: InternalRoom) {
    this.clearBotDrawing(room);
    room.botDrawingTimeouts = [];

    const strokes = BotDrawingEngine.generateStrokesForWord(
      room.secretWord,
      room.category,
      room.turnId
    );

    // Stream strokes across 35 seconds of the drawing phase
    const stepDurationMs = Math.min(5000, Math.floor(35000 / Math.max(1, strokes.length)));

    strokes.forEach((stroke, index) => {
      const delay = 1500 + index * stepDurationMs;
      const timeout = setTimeout(() => {
        if (
          !this.rooms.has(room.code) ||
          room.phase !== 'DRAWING' ||
          room.turnId !== stroke.turnId
        ) {
          return;
        }
        stroke.timestamp = Date.now();
        room.strokes.push(stroke);
        this.io.to(room.code).emit('drawing:stroke', stroke);
      }, delay);

      room.botDrawingTimeouts.push(timeout);
    });
  }

  private startWordSelection(room: InternalRoom) {
    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }
    if (room.selectionTimeout) {
      clearTimeout(room.selectionTimeout);
      room.selectionTimeout = null;
    }
    this.clearBotDrawing(room);
    room.isEndingRound = false;

    // Pick current drawer
    const drawerId = room.drawerOrder[room.drawerIndex];
    room.currentDrawerId = drawerId;
    const drawer = room.players.get(drawerId);

    for (const player of room.players.values()) {
      player.isDrawing = player.id === drawerId;
      player.hasGuessed = false;
    }

    room.phase = 'WORD_SELECTION';
    room.durationSeconds = 15;
    room.timerStart = Date.now();
    room.timerEnd = Date.now() + 15000;

    // Generate unique authoritative turnId
    room.turnId = `turn_${room.code}_r${room.currentRound}_t${room.drawerIndex}_${Date.now()}`;
    room.strokes = [];
    room.undoneStrokes = [];
    room.roundGuesserScores.clear();

    // Broadcast clean turn wipe to all clients
    this.io.to(room.code).emit('drawing:turnStart', {
      turnId: room.turnId,
      drawerId: room.currentDrawerId,
      strokes: [],
    });
    this.io.to(room.code).emit('drawing:cleared', {});

    // Generate 3 word choices strictly matching the room's difficulty level (NEVER mixed)
    let targetDiff: 'easy' | 'medium' | 'hard' = 'medium';
    const roomDiff = (room.settings.difficulty || '').toLowerCase();
    if (roomDiff === 'easy' || roomDiff === 'medium' || roomDiff === 'hard') {
      targetDiff = roomDiff as 'easy' | 'medium' | 'hard';
    }
    const usedWords = room.artworks.map((a) => a.word);
    room.wordOptions = WordService.getRandomWordOptions(targetDiff, usedWords);

    this.broadcastSystemMessage(
      room,
      `--- Round ${room.currentRound} • ${drawer ? drawer.name : 'Drawer'} is choosing a word! ---`
    );

    // Send word options to active drawer
    if (drawer && drawer.socketId !== 'bot_socket' && !drawer.id.startsWith('bot_')) {
      const drawerSocket = this.io.sockets.sockets.get(drawer.socketId);
      if (drawerSocket) {
        drawerSocket.emit('word:options', {
          options: room.wordOptions,
          durationSeconds: 15,
        });
      } else {
        this.io.to(drawer.socketId).emit('word:options', {
          options: room.wordOptions,
          durationSeconds: 15,
        });
      }
    }

    this.broadcastRoomState(room);

    // Auto-select first word if timeout occurs
    room.selectionTimeout = setTimeout(() => {
      if (room.phase === 'WORD_SELECTION' && this.rooms.has(room.code)) {
        this.selectWord(room, room.wordOptions[0].word);
      }
    }, 15000);

    // If drawer is bot, auto-select after 1.5s
    if (drawer && (drawer.socketId === 'bot_socket' || drawer.id.startsWith('bot_'))) {
      const botSelectTimer = setTimeout(() => {
        if (room.phase === 'WORD_SELECTION' && this.rooms.has(room.code)) {
          if (room.selectionTimeout) clearTimeout(room.selectionTimeout);
          this.selectWord(room, room.wordOptions[1].word);
        }
      }, 1500);
      room.botDrawingTimeouts.push(botSelectTimer);
    }
  }

  public selectWord(room: InternalRoom, chosenWord: string): boolean {
    if (room.phase !== 'WORD_SELECTION') return false;

    if (room.selectionTimeout) {
      clearTimeout(room.selectionTimeout);
      room.selectionTimeout = null;
    }

    const selectedDef =
      room.wordOptions.find((w) => w.word.toLowerCase() === chosenWord.toLowerCase()) ||
      room.wordOptions[0];

    room.secretWord = selectedDef.word;
    room.category = selectedDef.category;
    room.difficultyPoints = selectedDef.points;
    room.clue = WordService.generateInitialClue(selectedDef.word);

    this.startDrawingPhase(room);
    return true;
  }

  private startDrawingPhase(room: InternalRoom) {
    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }
    this.clearBotDrawing(room);

    room.phase = 'DRAWING';
    room.durationSeconds = room.settings.drawTimeSeconds;
    room.timerStart = Date.now();
    room.timerEnd = Date.now() + room.durationSeconds * 1000;

    const drawer = room.players.get(room.currentDrawerId || '');
    this.broadcastSystemMessage(
      room,
      `${drawer ? drawer.name : 'Drawer'} is drawing now! Start guessing!`
    );

    this.broadcastRoomState(room);

    // If drawer is AI bot, start streaming procedural vector strokes
    if (drawer && (drawer.socketId === 'bot_socket' || drawer.id.startsWith('bot_'))) {
      this.startBotDrawing(room);
    }

    // Authoritative Server Timer Tick Interval (1 Hz)
    room.timerInterval = setInterval(() => {
      const now = Date.now();
      const remainingMs = Math.max(0, room.timerEnd - now);
      const remainingSec = Math.ceil(remainingMs / 1000);

      // Clue hint reveals at 50% and 25% time
      const elapsedFraction = (room.durationSeconds - remainingSec) / room.durationSeconds;
      if (elapsedFraction >= 0.5 && !room.clue.includes(room.secretWord[0])) {
        room.clue = WordService.generateHintClue(room.secretWord, 0.25);
        this.io.to(room.code).emit('word:hint', { clue: room.clue });
      } else if (elapsedFraction >= 0.75) {
        room.clue = WordService.generateHintClue(room.secretWord, 0.5);
        this.io.to(room.code).emit('word:hint', { clue: room.clue });
      }

      // Check if time expired
      if (remainingMs <= 0) {
        if (room.timerInterval) {
          clearInterval(room.timerInterval);
          room.timerInterval = null;
        }
        this.endRound(room, 'Time is up!');
      }
    }, 1000);
  }

  public handleDrawingStroke(socket: Socket, roomCode: string, stroke: Stroke) {
    const room = this.getRoom(roomCode);
    if (!room || room.phase !== 'DRAWING') return;

    const playerId = room.socketToPlayerId.get(socket.id);
    if (playerId !== room.currentDrawerId) {
      // Reject stroke from non-drawer
      return;
    }

    // Reject stroke if it belongs to an expired turn
    if (stroke.turnId && stroke.turnId !== room.turnId) {
      return;
    }

    stroke.turnId = room.turnId;
    stroke.timestamp = Date.now();
    room.strokes.push(stroke);
    room.undoneStrokes = []; // reset redo stack on new stroke

    // Broadcast stroke to everyone else in the room
    socket.to(room.code).emit('drawing:stroke', stroke);
  }

  public handleDrawingUndo(socket: Socket, roomCode: string) {
    const room = this.getRoom(roomCode);
    if (!room || room.phase !== 'DRAWING') return;
    const playerId = room.socketToPlayerId.get(socket.id);
    if (playerId !== room.currentDrawerId) return;

    if (room.strokes.length > 0) {
      const popped = room.strokes.pop();
      if (popped) {
        room.undoneStrokes.push(popped);
        this.io.to(room.code).emit('drawing:undo', { strokeId: popped.id });
      }
    }
  }

  public handleDrawingRedo(socket: Socket, roomCode: string) {
    const room = this.getRoom(roomCode);
    if (!room || room.phase !== 'DRAWING') return;
    const playerId = room.socketToPlayerId.get(socket.id);
    if (playerId !== room.currentDrawerId) return;

    if (room.undoneStrokes.length > 0) {
      const restored = room.undoneStrokes.pop();
      if (restored) {
        room.strokes.push(restored);
        this.io.to(room.code).emit('drawing:redo', { stroke: restored });
      }
    }
  }

  public handleDrawingClear(socket: Socket, roomCode: string) {
    const room = this.getRoom(roomCode);
    if (!room || room.phase !== 'DRAWING') return;
    const playerId = room.socketToPlayerId.get(socket.id);
    if (playerId !== room.currentDrawerId) return;

    room.strokes = [];
    room.undoneStrokes = [];
    this.io.to(room.code).emit('drawing:cleared', {});
  }

  public handleGuess(
    socket: Socket,
    roomCode: string,
    rawText: string
  ): { handled: boolean } {
    const room = this.getRoom(roomCode);
    if (!room) return { handled: false };

    const playerId = room.socketToPlayerId.get(socket.id);
    if (!playerId) return { handled: false };

    const player = room.players.get(playerId);
    if (!player) return { handled: false };

    // Drawer cannot guess
    if (player.id === room.currentDrawerId) {
      socket.emit('chat:system', {
        text: "You are the Drawer! You can't guess your own word.",
      });
      return { handled: true };
    }

    // If player already guessed correctly this turn
    if (player.hasGuessed) {
      socket.emit('chat:system', {
        text: 'You have already guessed the word for this round!',
      });
      return { handled: true };
    }

    // If not in DRAWING phase, treat as regular chat
    if (room.phase !== 'DRAWING') {
      this.broadcastChatMessage(room, player.name, rawText, 'normal', player.id);
      return { handled: true };
    }

    // Evaluate guess
    const evalResult = GuessService.evaluateGuess(rawText, room.secretWord);

    if (evalResult.isCorrect) {
      // Correct guess!
      player.hasGuessed = true;
      const guessOrder = room.roundGuesserScores.size;
      const remainingSeconds = Math.max(0, Math.ceil((room.timerEnd - Date.now()) / 1000));

      const scoreResult = ScoringService.calculateGuesserScore(
        room.difficultyPoints,
        remainingSeconds,
        room.durationSeconds,
        guessOrder
      );

      player.score += scoreResult.totalPoints;
      player.correctGuessRank = guessOrder + 1;
      room.roundGuesserScores.set(player.id, scoreResult.totalPoints);

      // Re-sort player ranks
      this.updatePlayerRanks(room);

      // Notify player privately of exact points
      socket.emit('guess:success', {
        points: scoreResult.totalPoints,
        word: room.secretWord,
      });

      // Broadcast celebration card to room (without revealing the secret word to others!)
      this.io.to(room.code).emit('guess:correct', {
        playerId: player.id,
        playerName: player.name,
        pointsEarned: scoreResult.totalPoints,
        rank: player.correctGuessRank,
        newTotalScore: player.score,
      });

      this.broadcastRoomState(room);

      // Check if all non-drawers in room have guessed correctly
      const totalGuessers = Array.from(room.players.values()).filter(
        (p) => p.id !== room.currentDrawerId && !p.isDisconnected
      );
      const allGuessed = totalGuessers.every((p) => p.hasGuessed);

      if (allGuessed && totalGuessers.length > 0) {
        this.broadcastSystemMessage(room, 'All doodlers solved the word!');
        if (room.timerInterval) clearInterval(room.timerInterval);
        this.endRound(room, 'All doodlers solved the word!');
      }

      return { handled: true };
    }

    if (evalResult.isClose) {
      // Close guess alert exclusively to the guesser
      socket.emit('guess:close', {
        guess: rawText,
        message: `'${rawText}' is very close! Keep guessing!`,
      });
      // Broadcast normal chat to others so word isn't revealed
      this.broadcastChatMessage(room, player.name, rawText, 'close', player.id);
      return { handled: true };
    }

    // Regular incorrect guess
    this.broadcastChatMessage(room, player.name, rawText, 'normal', player.id);
    return { handled: true };
  }

  private endRound(room: InternalRoom, reason: string) {
    if (room.phase !== 'DRAWING' || room.isEndingRound) return;
    room.isEndingRound = true;
    room.phase = 'ROUND_RESULT';

    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }
    if (room.selectionTimeout) {
      clearTimeout(room.selectionTimeout);
      room.selectionTimeout = null;
    }
    this.clearBotDrawing(room);

    room.durationSeconds = 5;
    room.timerStart = Date.now();
    room.timerEnd = Date.now() + 5000;

    // Calculate drawer points
    const drawer = room.players.get(room.currentDrawerId || '');
    if (drawer) {
      const guesserScores = Array.from(room.roundGuesserScores.values());
      const totalGuessers = room.players.size - 1;
      const drawerReward = ScoringService.calculateDrawerReward(guesserScores, totalGuessers);
      drawer.score += drawerReward;
      this.updatePlayerRanks(room);
    }

    // Save artwork to match gallery
    const artwork: ArtworkRecord = {
      round: room.currentRound,
      drawerId: drawer ? drawer.id : 'unknown',
      drawerName: drawer ? drawer.name : 'Unknown Artist',
      word: room.secretWord,
      category: room.category,
      strokes: [...room.strokes],
      likes: Math.floor(Math.random() * 5),
    };
    room.artworks.push(artwork);

    // Save to persistent database
    db.saveArtwork({
      id: `art_${Date.now()}`,
      matchId: room.code,
      roundNumber: room.currentRound,
      drawerId: artwork.drawerId,
      drawerName: artwork.drawerName,
      secretWord: artwork.word,
      category: artwork.category,
      strokeCount: artwork.strokes.length,
      likesCount: artwork.likes,
      createdAt: Date.now(),
    });

    this.broadcastSystemMessage(
      room,
      `Round Over! The word was "${room.secretWord}".`
    );

    this.broadcastRoomState(room);

    // After 5s, rotate turn or end match
    setTimeout(() => {
      if (!this.rooms.has(room.code)) return;

      room.drawerIndex += 1;

      // Check if all players have drawn in this round
      if (room.drawerIndex >= room.drawerOrder.length) {
        room.drawerIndex = 0;
        room.currentRound += 1;
      }

      // Check if match is complete
      if (room.currentRound > room.totalRounds) {
        this.endMatch(room);
      } else {
        this.startWordSelection(room);
      }
    }, 5000);
  }

  private endMatch(room: InternalRoom) {
    room.phase = 'MATCH_RESULT';
    this.updatePlayerRanks(room);

    const sortedPlayers = Array.from(room.players.values()).sort(
      (a, b) => b.score - a.score
    );
    const winner = sortedPlayers[0];
    room.winnerId = winner ? winner.id : undefined;

    // Save match to database
    db.saveMatch({
      id: `match_${Date.now()}`,
      roomCode: room.code,
      mode: room.settings.isPrivate ? 'private' : 'casual',
      totalRounds: room.totalRounds,
      winnerId: winner ? winner.id : null,
      startedAt: room.createdAt,
      endedAt: Date.now(),
      participants: sortedPlayers.map((p, idx) => ({
        playerId: p.id,
        nickname: p.name,
        finalScore: p.score,
        finalRank: idx + 1,
        correctGuesses: Math.floor(p.score / 200),
        eloDelta: idx === 0 ? 25 : idx === 1 ? 12 : -10,
      })),
    });

    this.broadcastSystemMessage(
      room,
      `🏆 Match Complete! Winner: ${winner ? winner.name : 'Everyone'}!`
    );

    this.broadcastRoomState(room);
  }

  public handleRematchVote(socket: Socket, roomCode: string): boolean {
    const room = this.getRoom(roomCode);
    if (!room || room.phase !== 'MATCH_RESULT') return false;

    const playerId = room.socketToPlayerId.get(socket.id);
    if (!playerId) return false;

    room.rematchVotes.add(playerId);
    this.broadcastRoomState(room);

    // If majority voted rematch, restart game!
    const activeCount = Array.from(room.players.values()).filter(
      (p) => !p.isDisconnected
    ).length;
    if (room.rematchVotes.size >= Math.ceil(activeCount / 2)) {
      room.rematchVotes.clear();
      room.phase = 'LOBBY';
      room.currentRound = 1;
      for (const p of room.players.values()) {
        p.score = 0;
        p.isReady = false;
        p.isDrawing = false;
        p.hasGuessed = false;
      }
      this.broadcastSystemMessage(room, 'Rematch vote passed! Welcome back to the lobby.');
      this.broadcastRoomState(room);
    }

    return true;
  }

  public handleSpectatorReaction(
    socket: Socket,
    roomCode: string,
    reaction: string
  ) {
    const room = this.getRoom(roomCode);
    if (!room) return;

    this.io.to(room.code).emit('spectator:burst', {
      reaction,
      socketId: socket.id,
      timestamp: Date.now(),
    });
  }

  public handleArtworkLike(roomCode: string, roundNumber: number) {
    const room = this.getRoom(roomCode);
    if (!room) return;

    const art = room.artworks.find((a) => a.round === roundNumber);
    if (art) {
      art.likes += 1;
      this.io.to(room.code).emit('drawing:liked', {
        roundNumber,
        likes: art.likes,
      });
    }
  }

  // --- HELPERS ---

  private updatePlayerRanks(room: InternalRoom) {
    const sorted = Array.from(room.players.values()).sort((a, b) => b.score - a.score);
    sorted.forEach((p, index) => {
      p.rank = index + 1;
    });
  }

  private broadcastChatMessage(
    room: InternalRoom,
    playerName: string,
    text: string,
    type: 'normal' | 'close' | 'correct' | 'system' | 'cheer' = 'normal',
    playerId?: string
  ) {
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      playerId,
      playerName,
      text,
      type,
      timestamp: Date.now(),
      turnId: room.turnId,
      roundNumber: room.currentRound,
    };
    room.messages.push(message);
    if (room.messages.length > 100) room.messages.shift();
    this.io.to(room.code).emit('chat:message', message);
  }

  public broadcastSystemMessage(room: InternalRoom, text: string) {
    this.broadcastChatMessage(room, 'System', text, 'system');
  }

  public toClientRoomState(
    room: InternalRoom,
    isSpectator = false,
    forPlayerId?: string
  ): RoomState {
    const isDrawer = forPlayerId === room.currentDrawerId;
    const canSeeWord =
      isDrawer ||
      room.phase === 'ROUND_RESULT' ||
      room.phase === 'MATCH_RESULT' ||
      (isSpectator && !room.settings.isPrivate);

    const isEasy = (room.settings.difficulty || '').toUpperCase() === 'EASY';
    const isCategoryVisible =
      isEasy ||
      isDrawer ||
      room.phase === 'ROUND_RESULT' ||
      room.phase === 'MATCH_RESULT';

    return {
      code: room.code,
      hostId: room.hostId,
      settings: room.settings,
      players: Array.from(room.players.values()),
      phase: room.phase,
      currentRound: room.currentRound,
      totalRounds: room.totalRounds,
      turnId: room.turnId,
      currentDrawerId: room.currentDrawerId,
      drawerName: room.players.get(room.currentDrawerId || '')?.name,
      timerStart: room.timerStart,
      timerEnd: room.timerEnd,
      durationSeconds: room.durationSeconds,
      clue: room.clue,
      category: isCategoryVisible ? room.category : '',
      categoryVisible: isEasy,
      wordLength: room.secretWord.replace(/\s+/g, '').length,
      letterCount: room.secretWord.replace(/\s+/g, '').length,
      difficultyPoints: room.difficultyPoints,
      secretWord: canSeeWord ? room.secretWord : undefined,
      winnerId: room.winnerId,
      rematchVotes: Array.from(room.rematchVotes),
      artworks: room.artworks,
      voiceParticipants: this.voiceManager?.getConnectedParticipants(room.code) || [],
    };
  }

  public broadcastRoomState(room: InternalRoom) {
    for (const [socketId, playerId] of room.socketToPlayerId.entries()) {
      const clientState = this.toClientRoomState(room, false, playerId);
      this.io.to(socketId).emit('room:state', clientState);
    }
    // Also broadcast to spectators
    for (const spectatorId of room.spectatorSocketIds) {
      const spectatorState = this.toClientRoomState(room, true);
      this.io.to(spectatorId).emit('room:state', spectatorState);
    }
  }

  public sendRoomStateToSocket(socket: Socket, room: InternalRoom, isSpectator = false) {
    const playerId = room.socketToPlayerId.get(socket.id);
    const clientState = this.toClientRoomState(room, isSpectator, playerId);
    socket.emit('room:state', clientState);

    // Also send canvas stroke snapshot
    socket.emit('drawing:snapshot', { strokes: room.strokes });
  }

  private createFeaturedDemoRoom(code: string): InternalRoom {
    const mockHost: Player = {
      id: 'ply_mock_host',
      socketId: 'mock_socket_1',
      name: 'PixelMaster',
      avatar: { style: 'cat', hat: 'beret', color: '#7C3AED' },
      score: 840,
      rank: 1,
      isHost: true,
      isReady: true,
      isDrawing: true,
      hasGuessed: false,
    };

    const mockPlayer2: Player = {
      id: 'ply_mock_2',
      socketId: 'mock_socket_2',
      name: 'SpeedyDoodler',
      avatar: { style: 'fox', hat: 'headphones', color: '#F59E0B' },
      score: 620,
      rank: 2,
      isHost: false,
      isReady: true,
      isDrawing: false,
      hasGuessed: true,
    };

    const room: InternalRoom = {
      code,
      hostId: 'ply_mock_host',
      settings: {
        isPrivate: false,
        maxPlayers: 8,
        rounds: 3,
        drawTimeSeconds: 80,
        difficulty: 'medium',
        wordPackId: 'classic',
        language: 'en',
      },
      players: new Map([
        ['ply_mock_host', mockHost],
        ['ply_mock_2', mockPlayer2],
      ]),
      socketToPlayerId: new Map([
        ['mock_socket_1', 'ply_mock_host'],
        ['mock_socket_2', 'ply_mock_2'],
      ]),
      spectatorSocketIds: new Set(),
      phase: 'DRAWING',
      currentRound: 2,
      totalRounds: 3,
      turnId: `turn_${code}_r2_t0_${Date.now()}`,
      isEndingRound: false,
      selectionTimeout: null,
      botDrawingTimeouts: [],
      drawerOrder: ['ply_mock_host', 'ply_mock_2'],
      drawerIndex: 0,
      currentDrawerId: 'ply_mock_host',
      timerStart: Date.now() - 30000,
      timerEnd: Date.now() + 50000,
      durationSeconds: 80,
      timerInterval: null,
      secretWord: 'Flamingo',
      clue: 'F _ _ M _ _ _ O',
      category: 'Animals & Nature',
      difficultyPoints: 250,
      wordOptions: [],
      strokes: [
        {
          id: 'demo_stk_1',
          tool: 'brush',
          color: '#FF6B6B',
          size: 16,
          points: [
            { x: 500, y: 350 },
            { x: 520, y: 320 },
            { x: 550, y: 300 },
            { x: 590, y: 320 },
            { x: 610, y: 360 },
            { x: 580, y: 410 },
            { x: 530, y: 420 },
            { x: 500, y: 390 },
          ],
          seq: 1,
        },
        {
          id: 'demo_stk_2',
          tool: 'brush',
          color: '#FF6B6B',
          size: 8,
          points: [
            { x: 520, y: 320 },
            { x: 520, y: 240 },
            { x: 540, y: 190 },
            { x: 570, y: 170 },
            { x: 600, y: 180 },
          ],
          seq: 2,
        },
      ],
      undoneStrokes: [],
      roundGuesserScores: new Map([['ply_mock_2', 240]]),
      messages: [
        {
          id: 'msg_1',
          playerName: 'SpeedyDoodler',
          text: 'Is it a bird?',
          type: 'normal',
          timestamp: Date.now() - 25000,
        },
        {
          id: 'msg_2',
          playerName: 'SpeedyDoodler',
          text: 'flamingo',
          type: 'correct',
          timestamp: Date.now() - 15000,
        },
      ],
      artworks: [],
      rematchVotes: new Set(),
      createdAt: Date.now() - 120000,
    };

    this.rooms.set(code, room);
    return room;
  }
}
