import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { RoomManager } from '../server/game/RoomManager.js';
import { VoiceManager } from '../server/voice/VoiceManager.js';

describe('WebRTC Audio Integration & Signaling Exchange Verification', () => {
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

      socket.on('voice:join', (data, callback) => {
        const result = voiceManager.handleJoin(socket, data?.roomCode);
        if (typeof callback === 'function') callback(result);
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

      socket.on('voice:leave', (data, callback) => {
        voiceManager.handleLeave(socket, data?.roomCode);
        if (typeof callback === 'function') callback({ success: true });
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        port = typeof addr === 'object' && addr ? addr.port : 3014;
        resolve();
      });
    });
  });

  afterAll(async () => {
    ioServer.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('exchanges full WebRTC signaling sequence: Offer -> Answer -> ICE Candidate between 2 peers', async () => {
    const serverUrl = `http://localhost:${port}`;
    const peerA: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });
    const peerB: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });

    await Promise.all([
      new Promise((res) => peerA.on('connect', res)),
      new Promise((res) => peerB.on('connect', res)),
    ]);

    let roomCode = '';
    await new Promise<void>((resolve) => {
      peerA.emit('room:create', {
        playerName: 'Peer_A',
        avatar: { style: 'cat', hat: 'beret', color: '#7C3AED' },
        settings: { isPrivate: true, voiceChatEnabled: true },
      });
      peerA.once('room:state', (st: any) => { roomCode = st.code; resolve(); });
    });

    await new Promise<void>((resolve) => {
      peerB.emit('room:join', {
        roomCode,
        playerName: 'Peer_B',
        avatar: { style: 'fox', hat: 'headphones', color: '#06B6D4' },
      });
      peerB.once('room:state', () => resolve());
    });

    // Both join voice
    await new Promise((res) => peerA.emit('voice:join', { roomCode }, res));
    await new Promise((res) => peerB.emit('voice:join', { roomCode }, res));

    // Step 1: Peer B sends SDP Offer targeting Peer A
    const offerPromise = new Promise<any>((resolve) => {
      peerA.once('voice:signal', (payload) => {
        resolve(payload);
      });
    });

    peerB.emit('voice:signal', {
      roomCode,
      targetSocketId: peerA.id,
      signal: { type: 'offer', sdp: 'v=0\r\no=PeerB 1234 5678 IN IP4 127.0.0.1...' },
    });

    const receivedOffer = await offerPromise;
    expect(receivedOffer.senderSocketId).toBe(peerB.id);
    expect(receivedOffer.signal.type).toBe('offer');

    // Step 2: Peer A replies with SDP Answer targeting Peer B
    const answerPromise = new Promise<any>((resolve) => {
      peerB.once('voice:signal', (payload) => {
        resolve(payload);
      });
    });

    peerA.emit('voice:signal', {
      roomCode,
      targetSocketId: peerB.id,
      signal: { type: 'answer', sdp: 'v=0\r\no=PeerA 8765 4321 IN IP4 127.0.0.1...' },
    });

    const receivedAnswer = await answerPromise;
    expect(receivedAnswer.senderSocketId).toBe(peerA.id);
    expect(receivedAnswer.signal.type).toBe('answer');

    // Step 3: Peer B relays ICE Candidate targeting Peer A
    const candidatePromise = new Promise<any>((resolve) => {
      peerA.once('voice:signal', (payload) => {
        resolve(payload);
      });
    });

    peerB.emit('voice:signal', {
      roomCode,
      targetSocketId: peerA.id,
      signal: { candidate: 'candidate:1 1 UDP 2130706431 127.0.0.1 5000 typ host' },
    });

    const receivedCandidate = await candidatePromise;
    expect(receivedCandidate.senderSocketId).toBe(peerB.id);
    expect(receivedCandidate.signal.candidate).toContain('typ host');

    peerA.disconnect();
    peerB.disconnect();
  });

  it('relays speaking activity and mute indicators to other peers', async () => {
    const serverUrl = `http://localhost:${port}`;
    const peerA: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });
    const peerB: ClientSocketType = ClientSocket(serverUrl, { forceNew: true, transports: ['websocket'] });

    await Promise.all([
      new Promise((res) => peerA.on('connect', res)),
      new Promise((res) => peerB.on('connect', res)),
    ]);

    let roomCode = '';
    await new Promise<void>((resolve) => {
      peerA.emit('room:create', {
        playerName: 'Peer_A',
        avatar: { style: 'cat', hat: 'beret', color: '#7C3AED' },
        settings: { isPrivate: true, voiceChatEnabled: true },
      });
      peerA.once('room:state', (st: any) => { roomCode = st.code; resolve(); });
    });

    await new Promise<void>((resolve) => {
      peerB.emit('room:join', { roomCode, playerName: 'Peer_B', avatar: { style: 'fox', hat: 'none', color: '#06B6D4' } });
      peerB.once('room:state', () => resolve());
    });

    await new Promise((res) => peerA.emit('voice:join', { roomCode }, res));
    await new Promise((res) => peerB.emit('voice:join', { roomCode }, res));

    // Speaking event
    const speakingPromise = new Promise<any>((resolve) => {
      peerB.once('voice:user-speaking', (data) => resolve(data));
    });
    peerA.emit('voice:speaking', { roomCode, isSpeaking: true });
    const speakingData = await speakingPromise;
    expect(speakingData.socketId).toBe(peerA.id);
    expect(speakingData.isSpeaking).toBe(true);

    // Mute event
    const mutePromise = new Promise<any>((resolve) => {
      peerB.once('voice:user-muted', (data) => resolve(data));
    });
    peerA.emit('voice:mute', { roomCode, isMuted: true });
    const muteData = await mutePromise;
    expect(muteData.socketId).toBe(peerA.id);
    expect(muteData.isMuted).toBe(true);

    peerA.disconnect();
    peerB.disconnect();
  });
});
