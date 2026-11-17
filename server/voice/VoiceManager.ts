import { Server, Socket } from 'socket.io';
import { VoiceParticipant, VoiceSignalPayload } from '../../shared/types.js';
import { RoomManager, InternalRoom } from '../game/RoomManager.js';

export class VoiceManager {
  private io: Server;
  private roomManager: RoomManager;

  // roomCode -> Map<socketId, VoiceParticipant>
  private voiceRooms: Map<string, Map<string, VoiceParticipant>> = new Map();

  constructor(io: Server, roomManager: RoomManager) {
    this.io = io;
    this.roomManager = roomManager;
  }

  /**
   * Authorizes and connects a socket to private room voice session.
   * Strict authorization checks:
   * 1. Room must exist.
   * 2. Room must be PRIVATE (room.settings.isPrivate === true).
   * 3. Room must have voice chat enabled (room.settings.voiceChatEnabled === true).
   * 4. Socket must be an active registered player in the room.
   */
  public handleJoin(socket: Socket, roomCode: string): {
    success: boolean;
    error?: string;
    iceServers?: any[];
    participants?: VoiceParticipant[];
  } {
    const cleanCode = (roomCode || '').toUpperCase().replace('#', '').trim();
    const room = this.roomManager.getRoom(cleanCode);

    if (!room) {
      socket.emit('voice:error', { message: 'Room not found.' });
      return { success: false, error: 'Room not found.' };
    }

    // MANDATORY DIRECTIVE SECURITY CHECK: Voice ONLY in private rooms
    if (!room.settings.isPrivate) {
      socket.emit('voice:error', { message: 'Voice communication is strictly prohibited in public rooms.' });
      return { success: false, error: 'Voice communication is not permitted in public rooms.' };
    }

    // MANDATORY DIRECTIVE CHECK: Room must have voice chat enabled
    if (!room.settings.voiceChatEnabled) {
      socket.emit('voice:error', { message: 'Voice chat is disabled for this private room.' });
      return { success: false, error: 'Voice chat is disabled for this room.' };
    }

    // Spectator check
    if (room.spectatorSocketIds.has(socket.id)) {
      socket.emit('voice:error', { message: 'Spectators are not permitted in voice chat.' });
      return { success: false, error: 'Spectators cannot access voice chat.' };
    }

    const playerId = room.socketToPlayerId.get(socket.id);
    if (!playerId) {
      socket.emit('voice:error', { message: 'You must be a member of this room to access voice chat.' });
      return { success: false, error: 'Unauthorized socket.' };
    }

    const player = room.players.get(playerId);
    if (!player) {
      socket.emit('voice:error', { message: 'Player record not found.' });
      return { success: false, error: 'Player record not found.' };
    }

    if (!this.voiceRooms.has(cleanCode)) {
      this.voiceRooms.set(cleanCode, new Map());
    }

    const voiceRoom = this.voiceRooms.get(cleanCode)!;

    const participant: VoiceParticipant = {
      socketId: socket.id,
      playerId: player.id,
      playerName: player.name,
      avatar: player.avatar,
      isMuted: false,
      isSpeaking: false,
    };

    // Get list of existing participants before adding the new one
    const existingParticipants = Array.from(voiceRoom.values());
    const iceServers = this.getIceServers();

    voiceRoom.set(socket.id, participant);

    // Send existing users to the joining socket so it can initiate WebRTC offers
    socket.emit('voice:room-users', {
      participants: existingParticipants,
      iceServers,
    });

    // Notify other voice participants in room
    for (const [otherSocketId] of voiceRoom.entries()) {
      if (otherSocketId !== socket.id) {
        this.io.to(otherSocketId).emit('voice:user-joined', {
          participant,
        });
      }
    }

    // Broadcast updated voice participants list to all players in the room for UI counter
    this.broadcastVoiceState(room);

    return {
      success: true,
      iceServers,
      participants: existingParticipants,
    };
  }

  public handleLeave(socket: Socket, roomCode?: string) {
    for (const [code, voiceRoom] of this.voiceRooms.entries()) {
      if (roomCode && code !== roomCode.toUpperCase().replace('#', '').trim()) {
        continue;
      }

      if (voiceRoom.has(socket.id)) {
        voiceRoom.delete(socket.id);

        // Notify remaining participants
        for (const [otherSocketId] of voiceRoom.entries()) {
          this.io.to(otherSocketId).emit('voice:user-left', {
            socketId: socket.id,
          });
        }

        const room = this.roomManager.getRoom(code);
        if (room) {
          this.broadcastVoiceState(room);
        }

        if (voiceRoom.size === 0) {
          this.voiceRooms.delete(code);
        }
      }
    }
  }

  public handleSignal(socket: Socket, payload: VoiceSignalPayload) {
    const { roomCode, targetSocketId, signal } = payload || {};
    if (!roomCode || !targetSocketId || !signal) return;

    const cleanCode = roomCode.toUpperCase().replace('#', '').trim();
    const voiceRoom = this.voiceRooms.get(cleanCode);
    if (!voiceRoom) return;

    // Verify both sockets are authorized participants of this private voice room
    if (!voiceRoom.has(socket.id) || !voiceRoom.has(targetSocketId)) {
      return;
    }

    // Forward signaling payload directly to peer
    this.io.to(targetSocketId).emit('voice:signal', {
      senderSocketId: socket.id,
      signal,
    });
  }

  public handleMute(socket: Socket, roomCode: string, isMuted: boolean) {
    const cleanCode = roomCode.toUpperCase().replace('#', '').trim();
    const voiceRoom = this.voiceRooms.get(cleanCode);
    if (!voiceRoom || !voiceRoom.has(socket.id)) return;

    const participant = voiceRoom.get(socket.id)!;
    participant.isMuted = Boolean(isMuted);

    for (const [otherSocketId] of voiceRoom.entries()) {
      this.io.to(otherSocketId).emit('voice:user-muted', {
        socketId: socket.id,
        isMuted: participant.isMuted,
      });
    }
  }

  public handleSpeaking(socket: Socket, roomCode: string, isSpeaking: boolean) {
    const cleanCode = roomCode.toUpperCase().replace('#', '').trim();
    const voiceRoom = this.voiceRooms.get(cleanCode);
    if (!voiceRoom || !voiceRoom.has(socket.id)) return;

    const participant = voiceRoom.get(socket.id)!;
    participant.isSpeaking = Boolean(isSpeaking);

    for (const [otherSocketId] of voiceRoom.entries()) {
      this.io.to(otherSocketId).emit('voice:user-speaking', {
        socketId: socket.id,
        isSpeaking: participant.isSpeaking,
      });
    }
  }

  public handleRoomVoiceToggled(room: InternalRoom) {
    // If host disabled voice chat, terminate all ongoing voice sessions
    if (!room.settings.voiceChatEnabled || !room.settings.isPrivate) {
      const voiceRoom = this.voiceRooms.get(room.code);
      if (voiceRoom) {
        for (const [socketId] of voiceRoom.entries()) {
          this.io.to(socketId).emit('voice:terminated', {
            reason: 'Voice communication was disabled by the host.',
          });
        }
        this.voiceRooms.delete(room.code);
      }
    }
    this.broadcastVoiceState(room);
  }

  public getConnectedParticipants(roomCode: string): string[] {
    const cleanCode = roomCode.toUpperCase().replace('#', '').trim();
    const voiceRoom = this.voiceRooms.get(cleanCode);
    return voiceRoom ? Array.from(voiceRoom.keys()) : [];
  }

  public getVoiceParticipantsList(roomCode: string): VoiceParticipant[] {
    const cleanCode = roomCode.toUpperCase().replace('#', '').trim();
    const voiceRoom = this.voiceRooms.get(cleanCode);
    return voiceRoom ? Array.from(voiceRoom.values()) : [];
  }

  public isSocketInVoice(socketId: string, roomCode: string): boolean {
    const cleanCode = roomCode.toUpperCase().replace('#', '').trim();
    const voiceRoom = this.voiceRooms.get(cleanCode);
    return voiceRoom ? voiceRoom.has(socketId) : false;
  }

  private broadcastVoiceState(room: InternalRoom) {
    const participants = this.getConnectedParticipants(room.code);
    this.io.to(room.code).emit('voice:presence', {
      connectedCount: participants.length,
      participants,
    });
  }

  private getIceServers() {
    const stunServer = process.env.STUN_SERVER || 'stun:stun.l.google.com:19302';
    const iceServers: any[] = [{ urls: stunServer }];

    if (process.env.TURN_SERVER) {
      iceServers.push({
        urls: process.env.TURN_SERVER,
        username: process.env.TURN_USERNAME || '',
        credential: process.env.TURN_PASSWORD || '',
      });
    }

    return iceServers;
  }
}
