import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { RoomManager } from '../server/game/RoomManager.js';
import { RoomState } from '../shared/types.js';

describe('Room Membership Isolation & Concurrency Verification', () => {
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
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        port = typeof addr === 'object' && addr ? addr.port : 3011;
        resolve();
      });
    });
  });

  afterAll(async () => {
    ioServer.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('verifies creating Room 2 automatically cleans up membership from Room 1 for the same socket', async () => {
    const serverUrl = `http://localhost:${port}`;
    const client: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });
    await new Promise((res) => client.on('connect', res));

    let room1Code = '';
    let room2Code = '';

    // Create Room 1
    await new Promise<void>((resolve) => {
      client.emit('room:create', {
        playerName: 'Multi_Creator',
        avatar: { style: 'cat', hat: 'beret', color: '#7C3AED' },
        settings: { isPrivate: false },
      });
      client.once('room:state', (st: RoomState) => {
        room1Code = st.code;
        resolve();
      });
    });

    expect(roomManager.getRoom(room1Code)).toBeDefined();
    expect(roomManager.getRoom(room1Code)!.players.size).toBe(1);

    // Create Room 2 on the SAME socket
    await new Promise<void>((resolve) => {
      client.emit('room:create', {
        playerName: 'Multi_Creator',
        avatar: { style: 'cat', hat: 'beret', color: '#7C3AED' },
        settings: { isPrivate: false },
      });
      client.once('room:state', (st: RoomState) => {
        room2Code = st.code;
        resolve();
      });
    });

    expect(room2Code).not.toBe(room1Code);

    // Room 1 must be deleted (since sole player left) or no longer contain client.id
    const room1 = roomManager.getRoom(room1Code);
    if (room1) {
      expect(room1.socketToPlayerId.has(client.id!)).toBe(false);
    } else {
      expect(room1).toBeUndefined();
    }

    // Room 2 must contain the player
    const room2 = roomManager.getRoom(room2Code)!;
    expect(room2.socketToPlayerId.has(client.id!)).toBe(true);

    client.disconnect();
  });

  it('verifies joining Room 2 automatically leaves Room 1', async () => {
    const serverUrl = `http://localhost:${port}`;
    const hostA: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });
    const hostB: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });
    const jumper: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });

    await Promise.all([
      new Promise((res) => hostA.on('connect', res)),
      new Promise((res) => hostB.on('connect', res)),
      new Promise((res) => jumper.on('connect', res)),
    ]);

    let roomACode = '';
    let roomBCode = '';

    await new Promise<void>((resolve) => {
      hostA.emit('room:create', { playerName: 'Host_A', avatar: { style: 'cat', hat: 'none', color: '#111' } });
      hostA.once('room:state', (st: RoomState) => { roomACode = st.code; resolve(); });
    });

    await new Promise<void>((resolve) => {
      hostB.emit('room:create', { playerName: 'Host_B', avatar: { style: 'fox', hat: 'none', color: '#222' } });
      hostB.once('room:state', (st: RoomState) => { roomBCode = st.code; resolve(); });
    });

    // Jumper joins Room A
    await new Promise<void>((resolve) => {
      jumper.emit('room:join', { roomCode: roomACode, playerName: 'Jumper', avatar: { style: 'monkey', hat: 'none', color: '#333' } });
      jumper.once('room:state', () => resolve());
    });

    expect(roomManager.getRoom(roomACode)!.players.size).toBe(2);

    // Jumper joins Room B
    await new Promise<void>((resolve) => {
      jumper.emit('room:join', { roomCode: roomBCode, playerName: 'Jumper', avatar: { style: 'monkey', hat: 'none', color: '#333' } });
      jumper.once('room:state', () => resolve());
    });

    // Jumper must be removed from Room A
    const roomA = roomManager.getRoom(roomACode)!;
    expect(roomA.players.size).toBe(1);
    expect(roomA.socketToPlayerId.has(jumper.id!)).toBe(false);

    // Jumper must be present in Room B
    const roomB = roomManager.getRoom(roomBCode)!;
    expect(roomB.players.size).toBe(2);
    expect(roomB.socketToPlayerId.has(jumper.id!)).toBe(true);

    hostA.disconnect();
    hostB.disconnect();
    jumper.disconnect();
  });
});
