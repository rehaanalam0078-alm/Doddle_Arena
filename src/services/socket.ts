import { io, Socket } from 'socket.io-client';
import { RoomState, Stroke, WordOption, ChatMessage } from '@/types/game';

class SocketService {
  public socket: Socket | null = null;
  private isConnected = false;

  public connect(url = window.location.origin): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('⚡ Connected to Doodle Arena server:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('Disconnected from server:', reason);
    });

    return this.socket;
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
