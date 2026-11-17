import { Socket } from 'socket.io-client';
import { socketService } from './socket';
import { VoiceParticipant, VoiceSignalPayload, VoiceJoinResponse } from '@/types/game';

export interface VoiceState {
  isActive: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  autoplayBlocked: boolean;
  error: string | null;
  participants: Map<string, VoiceParticipant>; // socketId -> VoiceParticipant
}

export type VoiceStateListener = (state: VoiceState) => void;

class VoiceService {
  private localStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private speakingInterval: any = null;

  // socketId -> RTCPeerConnection
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  // socketId -> HTMLAudioElement
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  // socketId -> pending ICE candidates received before remoteDescription was set
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();

  private currentRoomCode: string | null = null;
  private iceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

  private state: VoiceState = {
    isActive: false,
    isConnecting: false,
    isMuted: false,
    isSpeaking: false,
    autoplayBlocked: false,
    error: null,
    participants: new Map(),
  };

  private listeners: Set<VoiceStateListener> = new Set();
  private boundSocket: Socket | null = null;
  private joinSessionCounter = 0;

  constructor() {
    socketService.subscribeSocketInstance((socket) => {
      this.rebindSocketListeners(socket);
    });
  }

  public subscribe(listener: VoiceStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): VoiceState {
    return {
      ...this.state,
      participants: new Map(this.state.participants),
    };
  }

  private notify() {
    const currentState = this.getState();
    for (const listener of this.listeners) {
      listener(currentState);
    }
  }

  private rebindSocketListeners(socket: Socket) {
    if (this.boundSocket === socket) return;

    if (this.boundSocket) {
      this.boundSocket.off('voice:room-users', this.handleRoomUsers);
      this.boundSocket.off('voice:user-joined', this.handleUserJoined);
      this.boundSocket.off('voice:user-left', this.handleUserLeft);
      this.boundSocket.off('voice:signal', this.handleSignal);
      this.boundSocket.off('voice:user-muted', this.handleUserMuted);
      this.boundSocket.off('voice:user-speaking', this.handleUserSpeaking);
      this.boundSocket.off('voice:terminated', this.handleTerminated);
      this.boundSocket.off('voice:error', this.handleError);
    }

    this.boundSocket = socket;

    socket.on('voice:room-users', this.handleRoomUsers);
    socket.on('voice:user-joined', this.handleUserJoined);
    socket.on('voice:user-left', this.handleUserLeft);
    socket.on('voice:signal', this.handleSignal);
    socket.on('voice:user-muted', this.handleUserMuted);
    socket.on('voice:user-speaking', this.handleUserSpeaking);
    socket.on('voice:terminated', this.handleTerminated);
    socket.on('voice:error', this.handleError);
  }

  public async join(roomCode: string): Promise<boolean> {
    if (this.state.isActive || this.state.isConnecting) return true;

    const currentJoinId = ++this.joinSessionCounter;
    this.currentRoomCode = roomCode.toUpperCase().replace('#', '').trim();
    this.state.isConnecting = true;
    this.state.error = null;
    this.state.autoplayBlocked = false;
    this.notify();

    try {
      // 1. Request microphone access
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported by your browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      // Cancellation check: if user clicked leave while permission was pending
      if (this.joinSessionCounter !== currentJoinId || !this.state.isConnecting) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }

      this.localStream = stream;

      // 2. Setup audio analysis for real-time speaking detection
      this.setupSpeakingDetector(this.localStream);

      // 3. Inform server of join request and wait for authorization ack
      const socket = socketService.getSocket();
      this.rebindSocketListeners(socket);

      const response: VoiceJoinResponse = await new Promise((resolve) => {
        let responded = false;
        socket.emit('voice:join', { roomCode: this.currentRoomCode }, (ack: VoiceJoinResponse) => {
          if (!responded) {
            responded = true;
            resolve(ack || { success: true });
          }
        });

        // Fallback in case of legacy server
        setTimeout(() => {
          if (!responded) {
            responded = true;
            resolve({ success: true });
          }
        }, 3000);
      });

      // Secondary cancellation check
      if (this.joinSessionCounter !== currentJoinId || !this.state.isConnecting) {
        this.cleanupMedia();
        return false;
      }

      if (!response.success) {
        throw new Error(response.error || 'Server rejected voice chat join.');
      }

      if (response.iceServers && Array.isArray(response.iceServers)) {
        this.iceServers = response.iceServers;
      }

      this.state.isActive = true;
      this.state.isConnecting = false;
      this.state.isMuted = false;
      this.notify();
      return true;
    } catch (err: any) {
      console.error('[VoiceService] Join failed:', err);
      let errorMsg = 'Could not access microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      this.state.error = errorMsg;
      this.state.isConnecting = false;
      this.state.isActive = false;
      this.cleanupMedia();
      this.notify();
      return false;
    }
  }

  public leave() {
    this.joinSessionCounter++;
    if (!this.state.isActive && !this.state.isConnecting) return;

    if (this.currentRoomCode) {
      const socket = socketService.getSocket();
      socket.emit('voice:leave', { roomCode: this.currentRoomCode });
    }

    this.cleanupMedia();
    this.closeAllPeerConnections();

    this.currentRoomCode = null;
    this.state.isActive = false;
    this.state.isConnecting = false;
    this.state.isSpeaking = false;
    this.state.autoplayBlocked = false;
    this.state.participants.clear();
    this.state.error = null;
    this.notify();
  }

  public toggleMute(): boolean {
    if (!this.localStream) return this.state.isMuted;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.state.isMuted = !audioTrack.enabled;

      if (this.currentRoomCode) {
        const socket = socketService.getSocket();
        socket.emit('voice:mute', {
          roomCode: this.currentRoomCode,
          isMuted: this.state.isMuted,
        });
      }

      this.notify();
      return this.state.isMuted;
    }

    return this.state.isMuted;
  }

  public async resumeAudioPlayback(): Promise<boolean> {
    try {
      for (const audioEl of this.audioElements.values()) {
        await audioEl.play();
      }
      this.state.autoplayBlocked = false;
      this.notify();
      return true;
    } catch (e) {
      console.warn('[VoiceService] Could not resume audio playback:', e);
      return false;
    }
  }

  // --- WebRTC Peer Connection Lifecycle ---

  private handleRoomUsers = async (data: { participants: VoiceParticipant[]; iceServers: RTCIceServer[] }) => {
    if (data.iceServers && Array.isArray(data.iceServers)) {
      this.iceServers = data.iceServers;
    }

    const currentMap = new Map<string, VoiceParticipant>();
    for (const p of data.participants) {
      currentMap.set(p.socketId, p);
    }
    this.state.participants = currentMap;
    this.notify();

    // As the new joiner, initiate WebRTC peer connections (offers) to all existing participants
    for (const remoteParticipant of data.participants) {
      await this.initiatePeerConnection(remoteParticipant.socketId, true);
    }
  };

  private handleUserJoined = (data: { participant: VoiceParticipant }) => {
    const { participant } = data;
    this.state.participants.set(participant.socketId, participant);
    this.notify();
  };

  private handleUserLeft = (data: { socketId: string }) => {
    const { socketId } = data;
    this.closePeerConnection(socketId);
    this.state.participants.delete(socketId);
    this.notify();
  };

  private handleUserMuted = (data: { socketId: string; isMuted: boolean }) => {
    const p = this.state.participants.get(data.socketId);
    if (p) {
      p.isMuted = data.isMuted;
      this.notify();
    }
  };

  private handleUserSpeaking = (data: { socketId: string; isSpeaking: boolean }) => {
    const p = this.state.participants.get(data.socketId);
    if (p) {
      p.isSpeaking = data.isSpeaking;
      this.notify();
    }
  };

  private handleTerminated = (data: { reason: string }) => {
    this.leave();
    this.state.error = data.reason || 'Voice chat terminated by room host.';
    this.notify();
  };

  private handleError = (data: { message: string }) => {
    this.state.error = data.message || 'Voice communication error.';
    this.notify();
  };

  private async flushPendingCandidates(socketId: string, pc: RTCPeerConnection) {
    const pending = this.pendingCandidates.get(socketId) || [];
    this.pendingCandidates.delete(socketId);
    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[VoiceService] Could not flush buffered ICE candidate:', e);
      }
    }
  }

  private handleSignal = async (data: { senderSocketId: string; signal: any }) => {
    const { senderSocketId, signal } = data;
    if (!this.state.isActive || !this.currentRoomCode) return;

    let pc = this.peerConnections.get(senderSocketId);

    if (!pc) {
      // Incoming offer from a peer
      pc = await this.initiatePeerConnection(senderSocketId, false);
    }

    try {
      if (signal.type === 'offer') {
        const socket = socketService.getSocket();
        const isPolite = (socket.id || '') > senderSocketId;

        // Collision avoidance
        if (pc.signalingState !== 'stable') {
          if (!isPolite) {
            console.warn('[VoiceService] Glare detected; impolite peer ignoring incoming offer from', senderSocketId);
            return;
          }
          await pc.setLocalDescription({ type: 'rollback' });
        }

        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        await this.flushPendingCandidates(senderSocketId, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('voice:signal', {
          roomCode: this.currentRoomCode,
          targetSocketId: senderSocketId,
          signal: answer,
        });
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        await this.flushPendingCandidates(senderSocketId, pc);
      } else if (signal.candidate) {
        if (!pc.remoteDescription) {
          // Buffer candidate until remote description is set
          let list = this.pendingCandidates.get(senderSocketId);
          if (!list) {
            list = [];
            this.pendingCandidates.set(senderSocketId, list);
          }
          list.push(signal.candidate);
        } else {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.warn('[VoiceService] Could not add ICE candidate:', e);
          }
        }
      }
    } catch (e) {
      console.error('[VoiceService] Error handling signal:', e);
    }
  };

  private async initiatePeerConnection(targetSocketId: string, isInitiator: boolean): Promise<RTCPeerConnection> {
    if (this.peerConnections.has(targetSocketId)) {
      return this.peerConnections.get(targetSocketId)!;
    }

    const pc = new RTCPeerConnection({
      iceServers: this.iceServers,
    });

    this.peerConnections.set(targetSocketId, pc);

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // ICE Candidate Relay
    pc.onicecandidate = (event) => {
      if (event.candidate && this.currentRoomCode) {
        const socket = socketService.getSocket();
        socket.emit('voice:signal', {
          roomCode: this.currentRoomCode,
          targetSocketId,
          signal: { candidate: event.candidate },
        });
      }
    };

    // Remote Audio Stream Reception
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        let audioEl = this.audioElements.get(targetSocketId);
        if (!audioEl) {
          audioEl = new Audio();
          audioEl.autoplay = true;
          this.audioElements.set(targetSocketId, audioEl);
        }
        audioEl.srcObject = remoteStream;
        audioEl.play().catch((e) => {
          if (e.name === 'NotAllowedError') {
            console.warn('[VoiceService] Audio autoplay blocked by browser policy:', e);
            this.state.autoplayBlocked = true;
            this.notify();
          }
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeerConnection(targetSocketId);
      }
    };

    // If initiator, create and send offer
    if (isInitiator) {
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
        });
        await pc.setLocalDescription(offer);

        const socket = socketService.getSocket();
        socket.emit('voice:signal', {
          roomCode: this.currentRoomCode,
          targetSocketId,
          signal: offer,
        });
      } catch (err) {
        console.error('[VoiceService] Create offer failed:', err);
      }
    }

    return pc;
  }

  private closePeerConnection(socketId: string) {
    this.pendingCandidates.delete(socketId);
    const pc = this.peerConnections.get(socketId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(socketId);
    }

    const audioEl = this.audioElements.get(socketId);
    if (audioEl) {
      audioEl.pause();
      audioEl.srcObject = null;
      this.audioElements.delete(socketId);
    }
  }

  private closeAllPeerConnections() {
    for (const socketId of Array.from(this.peerConnections.keys())) {
      this.closePeerConnection(socketId);
    }
  }

  // --- Speaking Activity Detector ---

  private setupSpeakingDetector(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.2;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let wasSpeaking = false;
      let silenceCounter = 0;

      this.speakingInterval = setInterval(() => {
        if (!this.analyser || this.state.isMuted) {
          if (wasSpeaking) {
            wasSpeaking = false;
            this.state.isSpeaking = false;
            this.broadcastSpeaking(false);
            this.notify();
          }
          return;
        }

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const isNowSpeaking = average > 18; // Audio threshold

        if (isNowSpeaking) {
          silenceCounter = 0;
          if (!wasSpeaking) {
            wasSpeaking = true;
            this.state.isSpeaking = true;
            this.broadcastSpeaking(true);
            this.notify();
          }
        } else {
          silenceCounter++;
          if (silenceCounter > 4 && wasSpeaking) {
            // ~400ms decay
            wasSpeaking = false;
            this.state.isSpeaking = false;
            this.broadcastSpeaking(false);
            this.notify();
          }
        }
      }, 100);
    } catch (e) {
      console.warn('[VoiceService] Could not start audio analyser:', e);
    }
  }

  private broadcastSpeaking(isSpeaking: boolean) {
    if (this.currentRoomCode) {
      const socket = socketService.getSocket();
      socket.emit('voice:speaking', {
        roomCode: this.currentRoomCode,
        isSpeaking,
      });
    }
  }

  private cleanupMedia() {
    if (this.speakingInterval) {
      clearInterval(this.speakingInterval);
      this.speakingInterval = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }
}

export const voiceService = new VoiceService();
