import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { RoomManager } from '../server/game/RoomManager.js';
import { RoomState } from '../shared/types.js';

describe('Private Room Security, Word Selection Authorization & Access Controls', () => {
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

      socket.on('spectator:join', (data) => {
        const res = roomManager.joinAsSpectator(socket, data.roomCode);
        if (!res.success) {
          socket.emit('room:joinError', { error: res.error });
        }
      });

      socket.on('player:ready', (data) => {
        roomManager.setPlayerReady(socket, data.roomCode, data.isReady);
      });

      socket.on('game:start', (data) => {
        roomManager.startGame(socket, data.roomCode);
      });

      socket.on('word:select', (data, callback) => {
        const room = roomManager.getRoom(data.roomCode);
        if (room) {
          const success = roomManager.selectWord(room, data.word, socket);
          if (typeof callback === 'function') {
            callback({ success, error: success ? undefined : 'Unauthorized word selection.' });
          }
        }
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        port = typeof addr === 'object' && addr ? addr.port : 3015;
        resolve();
      });
    });
  });

  afterAll(async () => {
    ioServer.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('rejects spectator attempts to join a private room without host authorization', async () => {
    const serverUrl = `http://localhost:${port}`;
    const host: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });
    const spectator: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });

    await Promise.all([
      new Promise((res) => host.on('connect', res)),
      new Promise((res) => spectator.on('connect', res)),
    ]);

    let roomCode = '';
    await new Promise<void>((resolve) => {
      host.emit('room:create', {
        playerName: 'Private_Host',
        avatar: { style: 'cat', hat: 'crown', color: '#7C3AED' },
        settings: { isPrivate: true },
      });
      host.once('room:state', (st: RoomState) => { roomCode = st.code; resolve(); });
    });

    // Spectator attempts to join private room
    const errPromise = new Promise<any>((resolve) => {
      spectator.once('room:joinError', (err) => resolve(err));
    });

    spectator.emit('spectator:join', { roomCode });
    const err = await errPromise;
    expect(err.error).toMatch(/private/i);

    host.disconnect();
    spectator.disconnect();
  });

  it('rejects word:select from a non-drawer or with an invalid word choice', async () => {
    const serverUrl = `http://localhost:${port}`;
    const clientA: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });
    const clientB: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });

    await Promise.all([
      new Promise((res) => clientA.on('connect', res)),
      new Promise((res) => clientB.on('connect', res)),
    ]);

    let roomCode = '';
    await new Promise<void>((resolve) => {
      clientA.emit('room:create', {
        playerName: 'Artist_A',
        avatar: { style: 'cat', hat: 'beret', color: '#7C3AED' },
        settings: { isPrivate: false, rounds: 1, drawTimeSeconds: 60 },
      });
      clientA.once('room:state', (st: RoomState) => { roomCode = st.code; resolve(); });
    });

    await new Promise<void>((resolve) => {
      clientB.emit('room:join', { roomCode, playerName: 'Artist_B', avatar: { style: 'fox', hat: 'none', color: '#06B6D4' } });
      clientB.once('room:state', (st: RoomState) => {
        if (st.players.length === 2) resolve();
      });
    });

    clientB.emit('player:ready', { roomCode, isReady: true });
    clientA.emit('game:start', { roomCode });

    // Wait for word:options
    const { drawer, guesser, options } = await new Promise<{ drawer: ClientSocketType; guesser: ClientSocketType; options: any[] }>((resolve) => {
      clientA.once('word:options', (d) => resolve({ drawer: clientA, guesser: clientB, options: d.options }));
      clientB.once('word:options', (d) => resolve({ drawer: clientB, guesser: clientA, options: d.options }));
    });

    // Case 1: Guesser tries to select word (should fail)
    const guesserRes = await new Promise<any>((resolve) => {
      guesser.emit('word:select', { roomCode, word: options[0].word }, (ack: any) => resolve(ack));
    });
    expect(guesserRes.success).toBe(false);

    // Case 2: Drawer tries to submit arbitrary fake word not in wordOptions (should fail)
    const fakeWordRes = await new Promise<any>((resolve) => {
      drawer.emit('word:select', { roomCode, word: 'COMPLETELY_UNOFFICIAL_HACK_WORD' }, (ack: any) => resolve(ack));
    });
    expect(fakeWordRes.success).toBe(false);

    // Case 3: Drawer submits legitimate option (should succeed)
    const legitimateWord = options[0].word;
    const legitimateRes = await new Promise<any>((resolve) => {
      drawer.emit('word:select', { roomCode, word: legitimateWord }, (ack: any) => resolve(ack));
    });
    expect(legitimateRes.success).toBe(true);

    const room = roomManager.getRoom(roomCode)!;
    expect(room.phase).toBe('DRAWING');
    expect(room.secretWord).toBe(legitimateWord);

    clientA.disconnect();
    clientB.disconnect();
  });
});
