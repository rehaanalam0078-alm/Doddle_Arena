import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { RoomManager } from './game/RoomManager.js';
import { TournamentService } from './game/TournamentService.js';
import { CompetitiveService } from './game/CompetitiveService.js';
import { db } from './db/Database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

const roomManager = new RoomManager(io);

// --- REST API ROUTES ---

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    game: 'Doodle Arena',
    version: '1.0.0',
    timestamp: Date.now(),
    onlineArtists: 14820 + Math.floor(Math.random() * 50),
  });
});

app.get('/api/leaderboard', (req, res) => {
  const top = db.getTopPlayers(100);
  res.json(top);
});

app.get('/api/rooms/public', (req, res) => {
  const publicRooms = roomManager.getPublicRooms();
  // Ensure at least one featured room is present
  if (publicRooms.length === 0) {
    const featured = roomManager.getRoom('PARTY-ANIMALS');
    if (!featured) {
      roomManager.joinAsSpectator({ id: 'init', join: () => {}, emit: () => {} } as any, 'PARTY-ANIMALS');
    }
  }
  res.json(roomManager.getPublicRooms());
});

app.get('/api/tournament', (req, res) => {
  res.json(TournamentService.getTournament());
});

app.post('/api/tournament/register', (req, res) => {
  const { name, tag } = req.body;
  TournamentService.registerParticipant(name || 'Doodler', tag || '#REG');
  res.json({ success: true, message: 'Successfully registered for Summer Masters Cup!' });
});

app.get('/api/competitive/battles', (req, res) => {
  res.json(CompetitiveService.getRecentBattles());
});

app.get('/api/shop/items', (req, res) => {
  res.json([
    {
      id: 'hat_beret',
      name: 'Artist Beret',
      type: 'hat',
      priceXP: 500,
      icon: 'palette',
      unlocked: true,
      description: 'The signature beret of passionate painters.',
    },
    {
      id: 'hat_headphones',
      name: 'Neon DJ Beats',
      type: 'hat',
      priceXP: 1200,
      icon: 'headphones',
      unlocked: true,
      description: 'Listen to synth beats while sketching masterpieces.',
    },
    {
      id: 'hat_crown',
      name: 'Imperial Golden Crown',
      type: 'hat',
      priceXP: 5000,
      icon: 'military_tech',
      unlocked: false,
      description: 'Forged for weekly tournament champions.',
    },
    {
      id: 'hat_sunglasses',
      name: 'Vibrant Sunset Shades',
      type: 'hat',
      priceXP: 800,
      icon: 'visibility',
      unlocked: true,
      description: 'Cool shades with purple UV gradient lenses.',
    },
    {
      id: 'brush_rainbow',
      name: 'Rainbow Prism Trail',
      type: 'brush_trail',
      priceXP: 2500,
      icon: 'auto_awesome',
      unlocked: false,
      description: 'Strokes shimmer with dynamic iridescent particles.',
    },
  ]);
});

// Serve frontend static build if exists
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('Doodle Arena API Server Running. Start Vite client for frontend.');
    }
  });
});

// --- SOCKET.IO MULTIPLAYER EVENT HANDLERS ---

io.on('connection', (socket: Socket) => {
  // Session Init
  socket.emit('session:init', {
    socketId: socket.id,
    serverTime: Date.now(),
  });

  // Room Create
  socket.on('room:create', (data) => {
    const { playerName, avatar, settings, customCode } = data || {};
    const room = roomManager.createRoom(
      socket,
      playerName || 'SpeedyPencil_99',
      avatar || { style: 'cat', hat: 'beret', color: '#7C3AED' },
      settings,
      customCode
    );
    roomManager.sendRoomStateToSocket(socket, room);
  });

  // Room Join
  socket.on('room:join', (data) => {
    const { roomCode, playerName, avatar } = data || {};
    const result = roomManager.joinRoom(
      socket,
      roomCode,
      playerName || 'Artist',
      avatar || { style: 'fox', hat: 'none', color: '#06B6D4' }
    );
    if (!result.success) {
      socket.emit('room:joinError', { error: result.error });
    } else if (result.room) {
      roomManager.sendRoomStateToSocket(socket, result.room);
    }
  });

  // Spectator Join
  socket.on('spectator:join', (data) => {
    const { roomCode } = data || {};
    const result = roomManager.joinAsSpectator(socket, roomCode);
    if (!result.success) {
      socket.emit('room:joinError', { error: result.error });
    }
  });

  // Ready Status
  socket.on('player:ready', (data) => {
    const { roomCode, isReady } = data || {};
    roomManager.setPlayerReady(socket, roomCode, Boolean(isReady));
  });

  // Settings Update
  socket.on('room:settingsUpdate', (data) => {
    const { roomCode, settings } = data || {};
    roomManager.updateRoomSettings(socket, roomCode, settings);
  });

  // Game Start
  socket.on('game:start', (data) => {
    const { roomCode } = data || {};
    const result = roomManager.startGame(socket, roomCode);
    if (!result.success) {
      socket.emit('game:startError', { error: result.error });
    }
  });

  // Word Selection
  socket.on('word:select', (data) => {
    const { roomCode, word } = data || {};
    const room = roomManager.getRoom(roomCode);
    if (room) {
      roomManager.selectWord(room, word);
    }
  });

  // Drawing Events
  socket.on('drawing:stroke', (data) => {
    const { roomCode, stroke } = data || {};
    roomManager.handleDrawingStroke(socket, roomCode, stroke);
  });

  socket.on('drawing:undo', (data) => {
    const { roomCode } = data || {};
    roomManager.handleDrawingUndo(socket, roomCode);
  });

  socket.on('drawing:redo', (data) => {
    const { roomCode } = data || {};
    roomManager.handleDrawingRedo(socket, roomCode);
  });

  socket.on('drawing:clear', (data) => {
    const { roomCode } = data || {};
    roomManager.handleDrawingClear(socket, roomCode);
  });

  socket.on('drawing:like', (data) => {
    const { roomCode, roundNumber } = data || {};
    roomManager.handleArtworkLike(roomCode, roundNumber);
  });

  // Guess & Chat
  socket.on('guess:submit', (data) => {
    const { roomCode, text } = data || {};
    roomManager.handleGuess(socket, roomCode, text || '');
  });

  socket.on('chat:message', (data) => {
    const { roomCode, text } = data || {};
    roomManager.handleGuess(socket, roomCode, text || '');
  });

  // Rematch Vote
  socket.on('rematch:vote', (data) => {
    const { roomCode } = data || {};
    roomManager.handleRematchVote(socket, roomCode);
  });

  // Spectator Burst Reaction
  socket.on('spectator:reaction', (data) => {
    const { roomCode, reaction } = data || {};
    roomManager.handleSpectatorReaction(socket, roomCode, reaction);
  });

  // Competitive Ranked Queue
  socket.on('ranked:queue', (data) => {
    const { playerId, playerName, elo } = data || {};
    const queueInfo = CompetitiveService.enqueue(socket.id, playerId, playerName, elo);
    socket.emit('ranked:queueStatus', {
      status: 'queued',
      position: queueInfo.position,
      estimatedWaitSeconds: queueInfo.avgWaitSeconds,
    });

    // Auto-match after 2 seconds for high responsiveness
    setTimeout(() => {
      CompetitiveService.dequeue(socket.id);
      const rankedRoomCode = roomManager.generateRoomCode();
      const room = roomManager.createRoom(
        socket,
        playerName || 'SpeedyPencil_99',
        { style: 'cat', hat: 'beret', color: '#7C3AED' },
        { isPrivate: false, rounds: 3, drawTimeSeconds: 60, difficulty: 'hard' },
        rankedRoomCode
      );
      socket.emit('ranked:matchFound', {
        roomCode: room.code,
        opponentName: 'NeonSketcher',
        opponentTier: 'Diamond II',
      });
      roomManager.sendRoomStateToSocket(socket, room);
    }, 2000);
  });

  socket.on('ranked:cancel', () => {
    CompetitiveService.dequeue(socket.id);
    socket.emit('ranked:queueStatus', { status: 'idle' });
  });

  // Disconnect
  socket.on('disconnect', () => {
    CompetitiveService.dequeue(socket.id);
    roomManager.handleDisconnect(socket);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎮 Doodle Arena Backend Server running on http://localhost:${PORT}`);
});
