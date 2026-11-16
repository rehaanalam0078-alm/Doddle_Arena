import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { RoomManager } from '../server/game/RoomManager.js';
import { RoomState, Stroke } from '../shared/types.js';

describe('Turn Rotation & Canvas Lifecycle Verification', () => {
  let server: http.Server;
  let ioServer: SocketIOServer;
  let roomManager: RoomManager;
  let port: number;

  beforeAll(async () => {
    const app = express();
    server = http.createServer(app);
    ioServer = new SocketIOServer(server, { cors: { origin: '*' } });
    roomManager = new RoomManager(ioServer);

    ioServer.on('connection', (socket) => {
      socket.emit('session:init', { socketId: socket.id });

      socket.on('room:create', (data) => {
        const room = roomManager.createRoom(
          socket,
          data.playerName,
          data.avatar,
          data.settings,
          data.customCode
        );
        roomManager.sendRoomStateToSocket(socket, room);
      });

      socket.on('room:join', (data) => {
        const res = roomManager.joinRoom(socket, data.roomCode, data.playerName, data.avatar);
        if (res.room) {
          roomManager.sendRoomStateToSocket(socket, res.room);
        }
      });

      socket.on('player:ready', (data) => {
        roomManager.setPlayerReady(socket, data.roomCode, data.isReady);
      });

      socket.on('game:start', (data) => {
        roomManager.startGame(socket, data.roomCode);
      });

      socket.on('word:select', (data) => {
        const room = roomManager.getRoom(data.roomCode);
        if (room) {
          roomManager.selectWord(room, data.word);
        }
      });

      socket.on('drawing:stroke', (data) => {
        roomManager.handleDrawingStroke(socket, data.roomCode, data.stroke);
      });

      socket.on('guess:submit', (data) => {
        roomManager.handleGuess(socket, data.roomCode, data.text);
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        port = typeof addr === 'object' && addr ? addr.port : 3002;
        resolve();
      });
    });
  });

  afterAll(async () => {
    ioServer.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('verifies canvas resets cleanly when turn rotates to next player', async () => {
    const serverUrl = `http://localhost:${port}`;
    const clientA: ClientSocketType = ClientSocket(serverUrl);
    const clientB: ClientSocketType = ClientSocket(serverUrl);

    await new Promise((res) => clientA.on('connect', res));
    await new Promise((res) => clientB.on('connect', res));

    let roomCode = '';

    // Step 1: Client A creates room
    await new Promise<void>((resolve) => {
      clientA.emit('room:create', {
        playerName: 'Artist_A',
        avatar: { style: 'cat', hat: 'beret', color: '#7C3AED' },
        settings: { rounds: 2, drawTimeSeconds: 60 },
      });
      clientA.on('room:state', (st: RoomState) => {
        if (!roomCode) {
          roomCode = st.code;
          resolve();
        }
      });
    });

    // Step 2: Client B joins room
    await new Promise<void>((resolve) => {
      clientB.emit('room:join', {
        roomCode,
        playerName: 'Artist_B',
        avatar: { style: 'fox', hat: 'headphones', color: '#06B6D4' },
      });
      clientB.on('room:state', (st: RoomState) => {
        if (st.players.length === 2) resolve();
      });
    });

    clientB.emit('player:ready', { roomCode, isReady: true });

    // Step 3: Start game
    clientA.emit('game:start', { roomCode });

    // Client tracking of canvas strokes
    let clientAStrokes: Stroke[] = [];
    let clientBStrokes: Stroke[] = [];

    clientA.on('drawing:stroke', (s: Stroke) => { clientAStrokes.push(s); });
    clientB.on('drawing:stroke', (s: Stroke) => { clientBStrokes.push(s); });
    clientA.on('drawing:cleared', () => { clientAStrokes = []; });
    clientB.on('drawing:cleared', () => { clientBStrokes = []; });
    clientA.on('drawing:turnStart', () => { clientAStrokes = []; });
    clientB.on('drawing:turnStart', () => { clientBStrokes = []; });

    // Step 4: Whichever client gets word:options selects a word for Turn 1
    const { drawer1, guesser1, wordOptions1 } = await new Promise<{
      drawer1: ClientSocketType;
      guesser1: ClientSocketType;
      wordOptions1: any[];
    }>((resolve) => {
      clientA.on('word:options', (data) => {
        resolve({ drawer1: clientA, guesser1: clientB, wordOptions1: data.options });
      });
      clientB.on('word:options', (data) => {
        resolve({ drawer1: clientB, guesser1: clientA, wordOptions1: data.options });
      });
    });

    const word1 = wordOptions1[0].word;
    drawer1.emit('word:select', { roomCode, word: word1 });

    // Wait for DRAWING phase
    await new Promise<void>((resolve) => {
      const h = (st: RoomState) => {
        if (st.phase === 'DRAWING') {
          drawer1.off('room:state', h);
          resolve();
        }
      };
      drawer1.on('room:state', h);
    });

    // Drawer 1 draws a stroke
    const stroke1: Stroke = {
      id: 'turn1_stroke_alpha',
      tool: 'brush',
      color: '#7C3AED',
      size: 10,
      points: [{ x: 50, y: 50 }, { x: 100, y: 100 }],
      seq: 1,
    };
    drawer1.emit('drawing:stroke', { roomCode, stroke: stroke1 });

    // Guesser 1 receives stroke 1
    await new Promise<void>((resolve) => {
      const check = () => {
        if (clientAStrokes.length > 0 || clientBStrokes.length > 0) resolve();
        else setTimeout(check, 50);
      };
      check();
    });

    // Verify stroke 1 is present on canvas before turn end
    const internalRoom = roomManager.getRoom(roomCode)!;
    expect(internalRoom.strokes.length).toBe(1);
    expect(internalRoom.strokes[0].id).toBe('turn1_stroke_alpha');

    // Guesser 1 solves the word to end Turn 1
    guesser1.emit('guess:submit', { roomCode, text: word1 });

    // Wait for Turn 2 transition: drawing:turnStart must be received on BOTH clients
    await Promise.all([
      new Promise<void>((resolve) => clientA.once('drawing:turnStart', () => resolve())),
      new Promise<void>((resolve) => clientB.once('drawing:turnStart', () => resolve())),
    ]);

    // Assert that room.strokes has been cleanly wiped on the server for Turn 2
    expect(internalRoom.strokes.length).toBe(0);
    // Assert that client-side strokes buffers were emptied on turn start
    expect(clientAStrokes.length).toBe(0);
    expect(clientBStrokes.length).toBe(0);

    // Clean up
    clientA.disconnect();
    clientB.disconnect();
  }, 25000);
});
