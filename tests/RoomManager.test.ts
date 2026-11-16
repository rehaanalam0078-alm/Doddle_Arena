import { describe, it, expect } from 'vitest';
import { RoomManager } from '../server/game/RoomManager.js';

describe('RoomManager Integration', () => {
  const createMockSocket = (id: string) => {
    return {
      id,
      join: () => {},
      leave: () => {},
      emit: () => {},
      to: () => ({ emit: () => {} }),
    } as any;
  };

  const mockIo = {
    to: () => ({ emit: () => {} }),
  } as any;

  it('creates a room with host and default settings', () => {
    const mgr = new RoomManager(mockIo);
    const hostSocket = createMockSocket('host_sock');

    const room = mgr.createRoom(
      hostSocket,
      'SpeedyPencil',
      { style: 'cat', hat: 'beret', color: '#7C3AED' },
      { rounds: 3, drawTimeSeconds: 80 }
    );

    expect(room.code).toBeDefined();
    expect(room.players.size).toBe(1);
    expect(room.phase).toBe('LOBBY');
    expect(room.settings.rounds).toBe(3);
    expect(room.settings.drawTimeSeconds).toBe(80);

    const hostPlayer = Array.from(room.players.values())[0];
    expect(hostPlayer.name).toBe('SpeedyPencil');
    expect(hostPlayer.isHost).toBe(true);
    expect(hostPlayer.isReady).toBe(true);
  });

  it('allows players to join and validates capacity', () => {
    const mgr = new RoomManager(mockIo);
    const host = createMockSocket('host_sock');
    const room = mgr.createRoom(
      host,
      'Host',
      { style: 'cat', hat: 'beret', color: '#7C3AED' },
      { maxPlayers: 2 }
    );

    const guest1 = createMockSocket('guest1_sock');
    const res1 = mgr.joinRoom(guest1, room.code, 'Guest1', {
      style: 'fox',
      hat: 'headphones',
      color: '#06B6D4',
    });
    expect(res1.success).toBe(true);
    expect(room.players.size).toBe(2);

    // 3rd player exceeds capacity
    const guest2 = createMockSocket('guest2_sock');
    const res2 = mgr.joinRoom(guest2, room.code, 'Guest2', {
      style: 'robot',
      hat: 'cap',
      color: '#F59E0B',
    });
    expect(res2.success).toBe(false);
    expect(res2.error).toContain('full');
  });

  it('handles player ready state toggles', () => {
    const mgr = new RoomManager(mockIo);
    const host = createMockSocket('host_sock');
    const room = mgr.createRoom(host, 'Host', { style: 'cat', hat: 'none', color: '#7C3AED' });

    const guest = createMockSocket('guest_sock');
    mgr.joinRoom(guest, room.code, 'Guest', { style: 'fox', hat: 'none', color: '#06B6D4' });

    const guestPlayer = Array.from(room.players.values()).find((p) => p.name === 'Guest');
    expect(guestPlayer?.isReady).toBe(false);

    mgr.setPlayerReady(guest, room.code, true);
    expect(guestPlayer?.isReady).toBe(true);
  });
});
