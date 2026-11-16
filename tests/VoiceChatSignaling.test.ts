import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { RoomManager } from '../server/game/RoomManager.js';
import { VoiceManager } from '../server/voice/VoiceManager.js';

describe('Private Room Voice Communication & WebRTC Signaling', () => {
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

      // Voice socket handlers matching server/index.ts
      socket.on('voice:join', (data) => {
        voiceManager.handleJoin(socket, data?.roomCode);
      });

      socket.on('voice:leave', (data) => {
        voiceManager.handleLeave(socket, data?.roomCode);
      });

      socket.on('voice:signal', (data) => {
        voiceManager.handleSignal(socket, data);
      });

      socket.on('voice:mute', (data) => {
        voiceManager.handleMute(socket, data?.roomCode, Boolean(data?.isMuted));
      });

      socket.on('voice:speaking', (data) => {
        voiceManager.handleSpeaking(socket, data?.roomCode, Boolean(data?.isSpeaking));
      });

      socket.on('disconnect', () => {
        voiceManager.handleLeave(socket);
        roomManager.handleDisconnect(socket);
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        port = typeof addr === 'object' && addr ? addr.port : 3099;
        resolve();
      });
    });
  });

  afterAll(async () => {
    ioServer.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const createClient = (): Promise<ClientSocketType> => {
    return new Promise((resolve) => {
      const client = ClientSocket(`http://localhost:${port}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      client.on('session:init', () => resolve(client));
    });
  };

  it('allows joining voice in private room with voice enabled', async () => {
    const clientA = await createClient();
    const clientB = await createClient();

    const privateRoomCode = 'PRIV-VOICE-1';

    // Client A creates private room with voiceChatEnabled = true
    await new Promise<void>((resolve) => {
      clientA.once('room:state', () => resolve());
      clientA.emit('room:create', {
        playerName: 'Alice',
        avatar: { style: 'cat', hat: 'beret', color: '#7C3AED' },
        settings: { isPrivate: true, voiceChatEnabled: true },
        customCode: privateRoomCode,
      });
    });

    // Client B joins the private room
    await new Promise<void>((resolve) => {
      clientB.once('room:state', () => resolve());
      clientB.emit('room:join', {
        roomCode: privateRoomCode,
        playerName: 'Bob',
        avatar: { style: 'fox', hat: 'none', color: '#06B6D4' },
      });
    });

    // Client A joins voice
    await new Promise<void>((resolve) => {
      clientA.once('voice:room-users', (data: any) => {
        expect(data.participants).toHaveLength(0);
        resolve();
      });
      clientA.emit('voice:join', { roomCode: privateRoomCode });
    });

    // Client B joins voice -> receives Client A in participants, Client A receives user-joined
    const [clientBRoomUsers, clientAUserJoined] = await Promise.all([
      new Promise<any>((resolve) => {
        clientB.once('voice:room-users', (data: any) => resolve(data));
      }),
      new Promise<any>((resolve) => {
        clientA.once('voice:user-joined', (data: any) => resolve(data));
      }),
      new Promise<void>((resolve) => {
        clientB.emit('voice:join', { roomCode: privateRoomCode });
        resolve();
      }),
    ]);

    expect(clientBRoomUsers.participants).toHaveLength(1);
    expect(clientBRoomUsers.participants[0].playerName).toBe('Alice');
    expect(clientAUserJoined.participant.playerName).toBe('Bob');

    // Test WebRTC signal relay from B to A
    const mockOffer = { type: 'offer', sdp: 'v=0...' };
    const signalPromise = new Promise<any>((resolve) => {
      clientA.once('voice:signal', (data: any) => resolve(data));
    });

    clientB.emit('voice:signal', {
      roomCode: privateRoomCode,
      targetSocketId: clientA.id,
      signal: mockOffer,
    });

    const receivedSignal = await signalPromise;
    expect(receivedSignal.senderSocketId).toBe(clientB.id);
    expect(receivedSignal.signal.type).toBe('offer');

    // Test Mute toggle relay
    const mutePromise = new Promise<any>((resolve) => {
      clientA.once('voice:user-muted', (data: any) => resolve(data));
    });

    clientB.emit('voice:mute', {
      roomCode: privateRoomCode,
      isMuted: true,
    });

    const muteData = await mutePromise;
    expect(muteData.socketId).toBe(clientB.id);
    expect(muteData.isMuted).toBe(true);

    // Test Speaking indicator relay
    const speakingPromise = new Promise<any>((resolve) => {
      clientA.once('voice:user-speaking', (data: any) => resolve(data));
    });

    clientB.emit('voice:speaking', {
      roomCode: privateRoomCode,
      isSpeaking: true,
    });

    const speakingData = await speakingPromise;
    expect(speakingData.socketId).toBe(clientB.id);
    expect(speakingData.isSpeaking).toBe(true);

    // Test Leave cleanup
    const leavePromise = new Promise<any>((resolve) => {
      clientA.once('voice:user-left', (data: any) => resolve(data));
    });

    clientB.emit('voice:leave', { roomCode: privateRoomCode });

    const leftData = await leavePromise;
    expect(leftData.socketId).toBe(clientB.id);

    clientA.disconnect();
    clientB.disconnect();
  });

  it('strictly blocks voice joining in public rooms', async () => {
    const client = await createClient();
    const publicRoomCode = 'PUB-ROOM-99';

    // Create public room
    await new Promise<void>((resolve) => {
      client.once('room:state', () => resolve());
      client.emit('room:create', {
        playerName: 'Charlie',
        avatar: { style: 'cat', hat: 'beret', color: '#7C3AED' },
        settings: { isPrivate: false },
        customCode: publicRoomCode,
      });
    });

    // Attempt to join voice in public room
    const errorPromise = new Promise<any>((resolve) => {
      client.once('voice:error', (err: any) => resolve(err));
    });

    client.emit('voice:join', { roomCode: publicRoomCode });

    const error = await errorPromise;
    expect(error.message).toContain('Voice communication is strictly prohibited in public rooms');

    client.disconnect();
  });

  it('strictly blocks voice joining in private rooms where voice is disabled', async () => {
    const client = await createClient();
    const disabledRoomCode = 'PRIV-DISABLED-1';

    // Create private room with voiceChatEnabled = false
    await new Promise<void>((resolve) => {
      client.once('room:state', () => resolve());
      client.emit('room:create', {
        playerName: 'Dave',
        avatar: { style: 'cat', hat: 'beret', color: '#7C3AED' },
        settings: { isPrivate: true, voiceChatEnabled: false },
        customCode: disabledRoomCode,
      });
    });

    // Attempt to join voice
    const errorPromise = new Promise<any>((resolve) => {
      client.once('voice:error', (err: any) => resolve(err));
    });

    client.emit('voice:join', { roomCode: disabledRoomCode });

    const error = await errorPromise;
    expect(error.message).toContain('Voice chat is disabled for this private room');

    client.disconnect();
  });
});
