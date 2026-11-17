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
import { VoiceManager } from './voice/VoiceManager.js';
import { wordRepository } from './db/WordRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Cross-Origin Resource Sharing (Configured for GitHub Pages & Cloud Hosting)
const allowedOrigins = [
  'https://rehaanalam0078-alm.github.io',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
];

if (process.env.CLIENT_ORIGIN) {
  allowedOrigins.push(...process.env.CLIENT_ORIGIN.split(',').map((s) => s.trim()));
}
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(...process.env.CORS_ORIGIN.split(',').map((s) => s.trim()));
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile, server-to-server) or listed origins
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive public multiplayer access
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 30000,
  pingInterval: 10000,
});

const roomManager = new RoomManager(io);
const voiceManager = new VoiceManager(io, roomManager);
roomManager.voiceManager = voiceManager;

// --- REST API ROUTES ---

app.get('/api/health', (req, res) => {
  const activeSockets = io.engine?.clientsCount || io.sockets.sockets.size || 1;
  const activeRooms = roomManager.getPublicRooms().length;
  res.json({
    status: 'ok',
    game: 'Doodle Arena',
    version: '1.0.0',
    timestamp: Date.now(),
    onlineArtists: Math.max(1, activeSockets),
    activeRooms,
    avgQueueSeconds: 2.5,
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

// --- WORD REPOSITORY REST APIS ---

app.get('/api/words/stats', (req, res) => {
  res.json(wordRepository.getStats());
});

app.get('/api/words/candidates', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  res.json(wordRepository.getCandidates(page, limit));
});

app.post('/api/words/candidates/:id/approve', (req, res) => {
  const success = wordRepository.approveCandidate(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Candidate word record not found' });
  }
  res.json({ success: true, message: `Candidate word ${req.params.id} approved and moved to active pool.` });
});

app.post('/api/words/candidates/:id/reject', (req, res) => {
  const success = wordRepository.rejectCandidate(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Candidate word record not found' });
  }
  res.json({ success: true, message: `Candidate word ${req.params.id} rejected and removed.` });
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

  // Room Leave
  socket.on('room:leave', (data, callback) => {
    const { roomCode } = data || {};
    const result = roomManager.leaveRoom(socket, roomCode);
    if (typeof callback === 'function') {
      callback(result);
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
  socket.on('word:select', (data, callback) => {
    const { roomCode, word } = data || {};
    const room = roomManager.getRoom(roomCode);
    if (room) {
      const success = roomManager.selectWord(room, word, socket);
      if (typeof callback === 'function') {
        callback({ success, error: success ? undefined : 'Unauthorized or invalid word selection.' });
      }
    } else if (typeof callback === 'function') {
      callback({ success: false, error: 'Room not found.' });
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
    roomManager.handleArtworkLike(socket, roomCode, roundNumber);
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

    // Check if 2 real players can be paired
    const match = CompetitiveService.checkMatch();
    if (match) {
      const rankedRoomCode = roomManager.generateRoomCode();
      const p1Socket = io.sockets.sockets.get(match.p1.socketId);
      const p2Socket = io.sockets.sockets.get(match.p2.socketId);

      if (p1Socket) {
        const room = roomManager.createRoom(
          p1Socket,
          match.p1.playerName,
          { style: 'cat', hat: 'beret', color: '#7C3AED' },
          { isPrivate: false, rounds: 3, drawTimeSeconds: 60, difficulty: 'hard' },
          rankedRoomCode
        );
        p1Socket.emit('ranked:matchFound', {
          roomCode: room.code,
          opponentName: match.p2.playerName,
        });
        roomManager.sendRoomStateToSocket(p1Socket, room);

        if (p2Socket) {
          roomManager.joinRoom(p2Socket, room.code, match.p2.playerName, {
            style: 'fox',
            hat: 'headphones',
            color: '#06B6D4',
          });
          p2Socket.emit('ranked:matchFound', {
            roomCode: room.code,
            opponentName: match.p1.playerName,
          });
          roomManager.sendRoomStateToSocket(p2Socket, room);
        }
      }
    }
  });

  socket.on('ranked:cancel', () => {
    CompetitiveService.dequeue(socket.id);
    socket.emit('ranked:queueStatus', { status: 'idle' });
  });

  // --- PRIVATE ROOM VOICE COMMUNICATION ---
  socket.on('voice:join', (data, callback) => {
    const { roomCode } = data || {};
    const result = voiceManager.handleJoin(socket, roomCode);
    if (typeof callback === 'function') {
      callback(result);
    }
  });

  socket.on('voice:leave', (data, callback) => {
    const { roomCode } = data || {};
    voiceManager.handleLeave(socket, roomCode);
    if (typeof callback === 'function') {
      callback({ success: true });
    }
  });

  socket.on('voice:signal', (data) => {
    voiceManager.handleSignal(socket, data);
  });

  socket.on('voice:mute', (data) => {
    const { roomCode, isMuted } = data || {};
    voiceManager.handleMute(socket, roomCode, Boolean(isMuted));
  });

  socket.on('voice:speaking', (data) => {
    const { roomCode, isSpeaking } = data || {};
    voiceManager.handleSpeaking(socket, roomCode, Boolean(isSpeaking));
  });

  // Disconnect
  socket.on('disconnect', () => {
    CompetitiveService.dequeue(socket.id);
    voiceManager.handleLeave(socket);
    roomManager.handleDisconnect(socket);
  });
});

const PORT = Number(process.env.PORT) || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Doodle Arena Backend Server running on http://0.0.0.0:${PORT}`);
});
