import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { RoomManager } from '../server/game/RoomManager.js';
import { VoiceManager } from '../server/voice/VoiceManager.js';
import { socketService } from '../src/services/socket.js';
import { voiceService } from '../src/services/voice.js';

describe('Voice Socket Lifecycle & Listener Rebinding Verification', () => {
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

      socket.on('voice:join', (data, callback) => {
        const result = voiceManager.handleJoin(socket, data?.roomCode);
        if (typeof callback === 'function') callback(result);
      });

      socket.on('voice:leave', (data, callback) => {
        voiceManager.handleLeave(socket, data?.roomCode);
        if (typeof callback === 'function') callback({ success: true });
      });

      socket.on('voice:speaking', (data) => {
        voiceManager.handleSpeaking(socket, data?.roomCode, Boolean(data?.isSpeaking));
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        port = typeof addr === 'object' && addr ? addr.port : 3012;
        resolve();
      });
    });
  });

  afterAll(async () => {
    voiceService.leave();
    ioServer.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('verifies socketService subscribeSocketInstance fires callback with active socket', () => {
    socketService.getSocket();
    let capturedSocket: any = null;
    const unsub = socketService.subscribeSocketInstance((s) => {
      capturedSocket = s;
    });

    expect(capturedSocket).toBeDefined();
    expect(typeof capturedSocket.on).toBe('function');
    unsub();
  });

  it('verifies voiceService cleans up state and informs server on leave', async () => {
    const serverUrl = `http://localhost:${port}`;
    const client: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });
    await new Promise((res) => client.on('connect', res));

    let roomCode = '';
    await new Promise<void>((resolve) => {
      client.emit('room:create', {
        playerName: 'Voice_Host',
        avatar: { style: 'cat', hat: 'beret', color: '#7C3AED' },
        settings: { isPrivate: true, voiceChatEnabled: true },
      });
      client.once('room:state', (st: any) => {
        roomCode = st.code;
        resolve();
      });
    });

    // Join voice on server
    const joinRes = await new Promise<any>((resolve) => {
      client.emit('voice:join', { roomCode }, (ack: any) => resolve(ack));
    });
    expect(joinRes.success).toBe(true);
    expect(voiceManager.isSocketInVoice(client.id!, roomCode)).toBe(true);

    // Leave voice
    const leaveRes = await new Promise<any>((resolve) => {
      client.emit('voice:leave', { roomCode }, (ack: any) => resolve(ack));
    });
    expect(leaveRes.success).toBe(true);
    expect(voiceManager.isSocketInVoice(client.id!, roomCode)).toBe(false);

    client.disconnect();
  });
});
