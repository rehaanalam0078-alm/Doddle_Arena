import { Socket } from 'socket.io-client';
import { socketService } from './socket';
import { VoiceParticipant, VoiceSignalPayload } from '@/types/game';

export interface VoiceState {
  isActive: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
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

  private currentRoomCode: string | null = null;
  private iceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

  private state: VoiceState = {
    isActive: false,
    isConnecting: false,
    isMuted: false,
    isSpeaking: false,
    error: null,
    participants: new Map(),
  };

  private listeners: Set<VoiceStateListener> = new Set();
  private socketListenersAttached = false;

  constructor() {
    this.setupSocketListeners();
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

  private setupSocketListeners() {
    if (this.socketListenersAttached) return;
    const socket = socketService.getSocket();
    if (!socket) return;

    socket.on('voice:room-users', this.handleRoomUsers);
    socket.on('voice:user-joined', this.handleUserJoined);
    socket.on('voice:user-left', this.handleUserLeft);
    socket.on('voice:signal', this.handleSignal);
    socket.on('voice:user-muted', this.handleUserMuted);
    socket.on('voice:user-speaking', this.handleUserSpeaking);
    socket.on('voice:terminated', this.handleTerminated);
    socket.on('voice:error', this.handleError);

    this.socketListenersAttached = true;
  }

  public async join(roomCode: string): Promise<boolean> {
    if (this.state.isActive || this.state.isConnecting) return true;

    this.currentRoomCode = roomCode.toUpperCase().replace('#', '').trim();
    this.state.isConnecting = true;
    this.state.error = null;
    this.notify();

    try {
      // 1. Request microphone access
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported by your browser environment.');
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      // 2. Setup audio analysis for real-time speaking detection
      this.setupSpeakingDetector(this.localStream);

      // 3. Inform server of join request
      const socket = socketService.getSocket();
      socket.emit('voice:join', { roomCode: this.currentRoomCode });

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
    // Do not initiate offer here; the newly joined user will initiate the offer to us
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
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        const socket = socketService.getSocket();
        socket.emit('voice:signal', {
          roomCode: this.currentRoomCode,
          targetSocketId: senderSocketId,
          signal: answer,
        });
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (e) {
          console.warn('[VoiceService] Could not add ICE candidate:', e);
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
        audioEl.play().catch((e) => console.warn('[VoiceService] Autoplay blocked:', e));
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
