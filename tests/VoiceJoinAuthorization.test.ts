import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { RoomManager } from '../server/game/RoomManager.js';
import { VoiceManager } from '../server/voice/VoiceManager.js';

describe('Voice Join Authorization & Privacy Boundaries', () => {
  let server: http.Server;
  let ioServer: SocketIOServer;
  let roomManager: RoomManager;
  let voiceManager: VoiceManager;
  let port: number;

  beforeAll(async () => {
    const app = express();
    server = http.createServer(app);
    ioServer = new SocketIOServer(server, { cors: { origin: '*' } });
    roomManager = new RoomManager(ioServer);
    voiceManager = new VoiceManager(ioServer, roomManager);
    roomManager.voiceManager = voiceManager;

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

      socket.on('voice:join', (data, callback) => {
        const result = voiceManager.handleJoin(socket, data?.roomCode);
        if (typeof callback === 'function') callback(result);
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        port = typeof addr === 'object' && addr ? addr.port : 3013;
        resolve();
      });
    });
  });

  afterAll(async () => {
    ioServer.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('rejects voice:join in a public room', async () => {
    const serverUrl = `http://localhost:${port}`;
    const client: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });
    await new Promise((res) => client.on('connect', res));

    let roomCode = '';
    await new Promise<void>((resolve) => {
      client.emit('room:create', {
        playerName: 'Public_Host',
        avatar: { style: 'cat', hat: 'beret', color: '#7C3AED' },
        settings: { isPrivate: false },
      });
      client.once('room:state', (st: any) => { roomCode = st.code; resolve(); });
    });

    const res = await new Promise<any>((resolve) => {
      client.emit('voice:join', { roomCode }, (ack: any) => resolve(ack));
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/public/i);

    client.disconnect();
  });

  it('rejects voice:join in private room where host disabled voice', async () => {
    const serverUrl = `http://localhost:${port}`;
    const client: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });
    await new Promise((res) => client.on('connect', res));

    let roomCode = '';
    await new Promise<void>((resolve) => {
      client.emit('room:create', {
        playerName: 'NoVoice_Host',
        avatar: { style: 'fox', hat: 'none', color: '#06B6D4' },
        settings: { isPrivate: true, voiceChatEnabled: false },
      });
      client.once('room:state', (st: any) => { roomCode = st.code; resolve(); });
    });

    const res = await new Promise<any>((resolve) => {
      client.emit('voice:join', { roomCode }, (ack: any) => resolve(ack));
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/disabled/i);

    client.disconnect();
  });

  it('rejects voice:join from spectators', async () => {
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
        playerName: 'Host_User',
        avatar: { style: 'monkey', hat: 'none', color: '#10B981' },
        settings: { isPrivate: false, voiceChatEnabled: true },
      });
      host.once('room:state', (st: any) => { roomCode = st.code; resolve(); });
    });

    // Spectator joins public room
    await new Promise<void>((resolve) => {
      spectator.emit('spectator:join', { roomCode });
      setTimeout(resolve, 100);
    });

    const res = await new Promise<any>((resolve) => {
      spectator.emit('voice:join', { roomCode }, (ack: any) => resolve(ack));
    });

    expect(res.success).toBe(false);

    host.disconnect();
    spectator.disconnect();
  });

  it('authorizes voice:join in private room with voice enabled and supplies ICE servers', async () => {
    const serverUrl = `http://localhost:${port}`;
    const host: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });
    const guest: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });

    await Promise.all([
      new Promise((res) => host.on('connect', res)),
      new Promise((res) => guest.on('connect', res)),
    ]);

    let roomCode = '';
    await new Promise<void>((resolve) => {
      host.emit('room:create', {
        playerName: 'Private_Host',
        avatar: { style: 'cat', hat: 'crown', color: '#7C3AED' },
        settings: { isPrivate: true, voiceChatEnabled: true },
      });
      host.once('room:state', (st: any) => { roomCode = st.code; resolve(); });
    });

    await new Promise<void>((resolve) => {
      guest.emit('room:join', {
        roomCode,
        playerName: 'Private_Guest',
        avatar: { style: 'fox', hat: 'headphones', color: '#06B6D4' },
      });
      guest.once('room:state', () => resolve());
    });

    // Host joins voice
    const hostVoiceRes = await new Promise<any>((resolve) => {
      host.emit('voice:join', { roomCode }, (ack: any) => resolve(ack));
    });
    expect(hostVoiceRes.success).toBe(true);
    expect(hostVoiceRes.iceServers).toBeDefined();
    expect(hostVoiceRes.iceServers.length).toBeGreaterThan(0);

    // Guest joins voice
    const guestVoiceRes = await new Promise<any>((resolve) => {
      guest.emit('voice:join', { roomCode }, (ack: any) => resolve(ack));
    });
    expect(guestVoiceRes.success).toBe(true);
    expect(guestVoiceRes.participants.length).toBe(1); // Host is already in room

    host.disconnect();
    guest.disconnect();
  });
});
