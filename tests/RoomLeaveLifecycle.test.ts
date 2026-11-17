import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { RoomManager } from '../server/game/RoomManager.js';
import { RoomState } from '../shared/types.js';

describe('Room Leave Lifecycle & Turn Advancement Verification', () => {
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

      socket.on('room:leave', (data, callback) => {
        const result = roomManager.leaveRoom(socket, data?.roomCode);
        if (typeof callback === 'function') callback(result);
      });

      socket.on('player:ready', (data) => {
        roomManager.setPlayerReady(socket, data.roomCode, data.isReady);
      });

      socket.on('game:start', (data) => {
        roomManager.startGame(socket, data.roomCode);
      });

      socket.on('disconnect', () => {
        roomManager.handleDisconnect(socket);
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        port = typeof addr === 'object' && addr ? addr.port : 3010;
        resolve();
      });
    });
  });

  afterAll(async () => {
    ioServer.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('verifies leaving room removes player from room state and prevents subsequent broadcasts', async () => {
    const serverUrl = `http://localhost:${port}`;
    const clientA: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });
    const clientB: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });

    await new Promise((res) => clientA.on('connect', res));
    await new Promise((res) => clientB.on('connect', res));

    let roomCode = '';

    // Step 1: Client A creates room
    await new Promise<void>((resolve) => {
      clientA.emit('room:create', {
        playerName: 'Host_Alice',
        avatar: { style: 'cat', hat: 'beret', color: '#7C3AED' },
        settings: { isPrivate: false, rounds: 2, drawTimeSeconds: 60 },
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
        playerName: 'Guest_Bob',
        avatar: { style: 'fox', hat: 'headphones', color: '#06B6D4' },
      });
      clientB.on('room:state', (st: RoomState) => {
        if (st.players.length === 2) resolve();
      });
    });

    const roomBeforeLeave = roomManager.getRoom(roomCode)!;
    expect(roomBeforeLeave.players.size).toBe(2);

    // Step 3: Client B leaves the room via room:leave
    let clientBReceivedBroadcastAfterLeave = false;
    clientB.on('room:state', () => {
      clientBReceivedBroadcastAfterLeave = true;
    });

    const leaveAck = await new Promise<any>((resolve) => {
      clientB.emit('room:leave', { roomCode }, (ack: any) => resolve(ack));
    });
    expect(leaveAck.success).toBe(true);

    // Verify server room state removed Client B
    const roomAfterLeave = roomManager.getRoom(roomCode)!;
    expect(roomAfterLeave.players.size).toBe(1);
    expect(roomAfterLeave.socketToPlayerId.has(clientB.id!)).toBe(false);

    // Step 4: Host updates settings (triggers broadcastRoomState)
    roomManager.broadcastRoomState(roomAfterLeave);

    await new Promise((res) => setTimeout(res, 200));

    // Client B must NOT have received any room:state broadcast after leaving
    expect(clientBReceivedBroadcastAfterLeave).toBe(false);

    clientA.disconnect();
    clientB.disconnect();
  });

  it('verifies host transfer to remaining player when host leaves room', async () => {
    const serverUrl = `http://localhost:${port}`;
    const clientA: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });
    const clientB: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });

    await new Promise((res) => clientA.on('connect', res));
    await new Promise((res) => clientB.on('connect', res));

    let roomCode = '';

    await new Promise<void>((resolve) => {
      clientA.emit('room:create', {
        playerName: 'Host_Original',
        avatar: { style: 'monkey', hat: 'crown', color: '#10B981' },
      });
      clientA.on('room:state', (st: RoomState) => {
        if (!roomCode) {
          roomCode = st.code;
          resolve();
        }
      });
    });

    await new Promise<void>((resolve) => {
      clientB.emit('room:join', {
        roomCode,
        playerName: 'Successor_Player',
        avatar: { style: 'panda', hat: 'cap', color: '#F59E0B' },
      });
      clientB.on('room:state', (st: RoomState) => {
        if (st.players.length === 2) resolve();
      });
    });

    // Client A (Host) leaves
    await new Promise<void>((resolve) => {
      clientA.emit('room:leave', { roomCode }, () => resolve());
    });

    // Check room on server
    const room = roomManager.getRoom(roomCode)!;
    expect(room.players.size).toBe(1);
    const remaining = Array.from(room.players.values())[0];
    expect(remaining.isHost).toBe(true);
    expect(room.hostId).toBe(remaining.id);

    clientA.disconnect();
    clientB.disconnect();
  });

  it('verifies room is completely deleted when last player leaves', async () => {
    const serverUrl = `http://localhost:${port}`;
    const client: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });
    await new Promise((res) => client.on('connect', res));

    let roomCode = '';
    await new Promise<void>((resolve) => {
      client.emit('room:create', {
        playerName: 'Solo_Player',
        avatar: { style: 'bear', hat: 'beret', color: '#EF4444' },
      });
      client.on('room:state', (st: RoomState) => {
        if (!roomCode) {
          roomCode = st.code;
          resolve();
        }
      });
    });

    expect(roomManager.getRoom(roomCode)).toBeDefined();

    // Solo player leaves
    await new Promise<void>((resolve) => {
      client.emit('room:leave', { roomCode }, () => resolve());
    });

    // Room must be deleted from memory
    expect(roomManager.getRoom(roomCode)).toBeUndefined();

    client.disconnect();
  });
});
