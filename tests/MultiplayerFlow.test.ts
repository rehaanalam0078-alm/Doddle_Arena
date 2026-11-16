import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { RoomManager } from '../server/game/RoomManager.js';
import { RoomState, Stroke } from '../shared/types.js';

describe('End-to-End Real-Time Multiplayer Flow', () => {
  let server: http.Server;
  let ioServer: SocketIOServer;
  let roomManager: RoomManager;
  let port: number;

  beforeAll(async () => {
    const app = express();
    server = http.createServer(app);
    ioServer = new SocketIOServer(server, { cors: { origin: '*' } });
    roomManager = new RoomManager(ioServer);

    // Setup socket handlers matching server/index.ts
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

      socket.on('spectator:join', (data) => {
        const res = roomManager.joinAsSpectator(socket, data.roomCode);
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
        port = typeof addr === 'object' && addr ? addr.port : 3001;
        resolve();
      });
    });
  });

  afterAll(async () => {
    ioServer.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('executes full 3-client match: Room Creation, Joining, Word Selection, Real-Time Drawing Sync, Correct Guess & Spectator Sync', async () => {
    const serverUrl = `http://localhost:${port}`;

    // 1. Connect Player A (Host)
    const clientA: ClientSocketType = ClientSocket(serverUrl);
    // 2. Connect Player B (Guesser)
    const clientB: ClientSocketType = ClientSocket(serverUrl);

    await new Promise((res) => clientA.on('connect', res));
    await new Promise((res) => clientB.on('connect', res));

    let roomCode = '';

    console.log('--- TEST STEP 1: CREATE ROOM ---');
    // Step 1: Player A creates private room
    const roomStateA = await new Promise<RoomState>((resolve) => {
      clientA.emit('room:create', {
        playerName: 'Alice_Host',
        avatar: { style: 'cat', hat: 'beret', color: '#7C3AED' },
        settings: { rounds: 2, drawTimeSeconds: 60 },
      });
      clientA.on('room:state', (st) => {
        if (!roomCode) {
          roomCode = st.code;
          resolve(st);
        }
      });
    });
    console.log('--- TEST STEP 1 DONE: roomCode =', roomCode);

    console.log('--- TEST STEP 2: JOIN ROOM B ---');
    // Step 2: Player B joins using roomCode
    const roomStateB = await new Promise<RoomState>((resolve) => {
      clientB.emit('room:join', {
        roomCode,
        playerName: 'Bob_Guesser',
        avatar: { style: 'fox', hat: 'headphones', color: '#06B6D4' },
      });
      clientB.on('room:state', (st) => {
        if (st.players.length === 2) {
          resolve(st);
        }
      });
    });
    console.log('--- TEST STEP 2 DONE: players =', roomStateB.players.length);

    console.log('--- TEST STEP 3: READY B ---');
    clientB.emit('player:ready', { roomCode, isReady: true });

    console.log('--- TEST STEP 4: START GAME A ---');
    clientA.emit('game:start', { roomCode });

    console.log('--- TEST STEP 5: WAIT FOR WORD OPTIONS ---');

    // Step 5: Whichever player was randomly chosen as Drawer receives 3 word options
    const { drawerClient, guesserClient, wordOptions } = await new Promise<{
      drawerClient: ClientSocketType;
      guesserClient: ClientSocketType;
      wordOptions: any[];
    }>((resolve) => {
      clientA.on('word:options', (data) => {
        resolve({ drawerClient: clientA, guesserClient: clientB, wordOptions: data.options });
      });
      clientB.on('word:options', (data) => {
        resolve({ drawerClient: clientB, guesserClient: clientA, wordOptions: data.options });
      });
    });

    expect(wordOptions).toHaveLength(3);
    const chosenWord = wordOptions[0].word;

    // Step 6: Active Drawer selects word
    drawerClient.emit('word:select', { roomCode, word: chosenWord });

    // Wait for room to enter DRAWING phase
    await new Promise<void>((resolve) => {
      const handler = (st: RoomState) => {
        if (st.phase === 'DRAWING') {
          drawerClient.off('room:state', handler);
          resolve();
        }
      };
      drawerClient.on('room:state', handler);
    });

    // Step 7: Drawer sends a real drawing stroke
    const testStroke: Stroke = {
      id: 'stk_test_1',
      tool: 'brush',
      color: '#7C3AED',
      size: 8,
      points: [{ x: 100, y: 150 }, { x: 120, y: 170 }],
      seq: 1,
    };

    const receivedStroke = await new Promise<Stroke>((resolve) => {
      guesserClient.on('drawing:stroke', (stroke) => {
        resolve(stroke);
      });
      drawerClient.emit('drawing:stroke', { roomCode, stroke: testStroke });
    });

    expect(receivedStroke.id).toBe(testStroke.id);
    expect(receivedStroke.points).toHaveLength(2);

    // Step 8: Spectator C connects mid-match
    const clientC: ClientSocketType = ClientSocket(serverUrl);
    await new Promise((res) => clientC.on('connect', res));

    const spectatorSnapshot = await new Promise<any>((resolve) => {
      clientC.on('drawing:snapshot', (snap) => {
        resolve(snap);
      });
      clientC.emit('spectator:join', { roomCode });
    });

    expect(spectatorSnapshot.strokes).toHaveLength(1);
    expect(spectatorSnapshot.strokes[0].id).toBe(testStroke.id);

    // Step 9: Guesser submits correct word
    const guessSuccess = await new Promise<any>((resolve) => {
      guesserClient.on('guess:success', (res) => {
        resolve(res);
      });
      guesserClient.emit('guess:submit', { roomCode, text: chosenWord });
    });

    expect(guessSuccess.word).toBe(chosenWord);
    expect(guessSuccess.points).toBeGreaterThan(0);

    // Clean up sockets
    clientA.disconnect();
    clientB.disconnect();
    clientC.disconnect();
  }, 30000);
});
