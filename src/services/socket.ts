import { io, Socket } from 'socket.io-client';
import { RoomState, Stroke, WordOption, ChatMessage } from '@/types/game';
import { getBackendUrl } from '@/config/backend';

export type SocketConnectionListener = (connected: boolean) => void;

class SocketService {
  public socket: Socket | null = null;
  public isConnected = false;
  private currentUrl = '';
  private listeners: Set<SocketConnectionListener> = new Set();

  public subscribeConnection(listener: SocketConnectionListener): () => void {
    this.listeners.add(listener);
    listener(this.isConnected);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(connected: boolean) {
    this.isConnected = connected;
    for (const listener of this.listeners) {
      listener(connected);
    }
  }

  public connect(customUrl?: string): Socket {
    const targetUrl = customUrl !== undefined ? customUrl : getBackendUrl();

    // If socket exists and connected to same target, reuse it
    if (this.socket && this.socket.connected && this.currentUrl === targetUrl) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.currentUrl = targetUrl;

    // If on GitHub Pages and no target URL is configured, defer connection without crashing
    if (!targetUrl && typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
      console.warn('⚡ [Doodle Arena] Backend URL not configured. Running in offline/demo mode. Set VITE_BACKEND_URL or configure in Settings.');
      // Create disconnected dummy socket
      this.socket = io({
        autoConnect: false,
      });
      this.notify(false);
      return this.socket;
    }

    this.socket = io(targetUrl || window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('⚡ Connected to Doodle Arena server:', this.socket?.id, 'at', targetUrl || window.location.origin);
      this.notify(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      this.notify(false);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('⚡ [Doodle Arena] Backend connection waiting:', err.message);
      this.notify(false);
    });

    return this.socket;
  }

  public reconnect(newUrl?: string): Socket {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    return this.connect(newUrl);
  }

  public getSocket(): Socket {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  // --- Emitters ---

  public createRoom(
    playerName: string,
    avatar: any,
    settings?: any,
    customCode?: string
  ) {
    this.getSocket().emit('room:create', { playerName, avatar, settings, customCode });
  }

  public joinRoom(roomCode: string, playerName: string, avatar: any) {
    this.getSocket().emit('room:join', { roomCode, playerName, avatar });
  }

  public joinSpectator(roomCode: string) {
    this.getSocket().emit('spectator:join', { roomCode });
  }

  public setReady(roomCode: string, isReady: boolean) {
    this.getSocket().emit('player:ready', { roomCode, isReady });
  }

  public updateSettings(roomCode: string, settings: any) {
    this.getSocket().emit('room:settingsUpdate', { roomCode, settings });
  }

  public startGame(roomCode: string) {
    this.getSocket().emit('game:start', { roomCode });
  }

  public selectWord(roomCode: string, word: string) {
    this.getSocket().emit('word:select', { roomCode, word });
  }

  public sendStroke(roomCode: string, stroke: Stroke) {
    this.getSocket().emit('drawing:stroke', { roomCode, stroke });
  }

  public sendUndo(roomCode: string) {
    this.getSocket().emit('drawing:undo', { roomCode });
  }

  public sendRedo(roomCode: string) {
    this.getSocket().emit('drawing:redo', { roomCode });
  }

  public sendClear(roomCode: string) {
    this.getSocket().emit('drawing:clear', { roomCode });
  }

  public sendGuess(roomCode: string, text: string) {
    this.getSocket().emit('guess:submit', { roomCode, text });
  }

  public sendChatMessage(roomCode: string, text: string) {
    this.getSocket().emit('chat:message', { roomCode, text });
  }

  public voteRematch(roomCode: string) {
    this.getSocket().emit('rematch:vote', { roomCode });
  }

  public sendSpectatorReaction(roomCode: string, reaction: string) {
    this.getSocket().emit('spectator:reaction', { roomCode, reaction });
  }

  public sendArtworkLike(roomCode: string, roundNumber: number) {
    this.getSocket().emit('drawing:like', { roomCode, roundNumber });
  }

  public queueRanked(playerId: string, playerName: string, elo: number) {
    this.getSocket().emit('ranked:queue', { playerId, playerName, elo });
  }

  public cancelRankedQueue() {
    this.getSocket().emit('ranked:cancel');
  }
}

export const socketService = new SocketService();
