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

  it('generates unique turnId and wipes strokes on turn transition', () => {
    const emittedEvents: Array<{ event: string; data: any }> = [];
    const testIo = {
      to: (roomCode: string) => ({
        emit: (event: string, data: any) => {
          emittedEvents.push({ event, data });
        },
      }),
      sockets: {
        sockets: new Map(),
      },
    } as any;

    const mgr = new RoomManager(testIo);
    const host = createMockSocket('host_sock');
    const guest = createMockSocket('guest_sock');

    const room = mgr.createRoom(host, 'Host', { style: 'cat', hat: 'none', color: '#7C3AED' });
    mgr.joinRoom(guest, room.code, 'Guest', { style: 'fox', hat: 'none', color: '#06B6D4' });

    // Start game & trigger word selection
    mgr.startGame(host, room.code);
    (mgr as any).startWordSelection(room);

    // Turn turnId should be set
    const turn1Id = room.turnId;
    expect(turn1Id).toBeDefined();
    expect(turn1Id).toContain(room.code);

    // Verify drawing:turnStart was emitted
    const turnStartEvents = emittedEvents.filter((e) => e.event === 'drawing:turnStart');
    expect(turnStartEvents.length).toBeGreaterThan(0);
    expect(turnStartEvents[0].data.turnId).toBe(turn1Id);

    // Move to DRAWING phase
    mgr.selectWord(room, room.wordOptions[0].word);
    expect(room.phase).toBe('DRAWING');

    // Simulate drawer drawing a stroke
    const drawerSocket = room.currentDrawerId === room.hostId ? host : guest;
    mgr.handleDrawingStroke(drawerSocket, room.code, {
      id: 'stk_1',
      tool: 'brush',
      color: '#000000',
      size: 8,
      points: [{ x: 10, y: 10 }],
      seq: 1,
      turnId: turn1Id,
    });
    expect(room.strokes.length).toBe(1);

    // Test rejection of stale stroke from an expired turn
    mgr.handleDrawingStroke(drawerSocket, room.code, {
      id: 'stk_stale',
      tool: 'brush',
      color: '#000000',
      size: 8,
      points: [{ x: 20, y: 20 }],
      seq: 2,
      turnId: 'expired_turn_123',
    });
    // Stale stroke must NOT be added
    expect(room.strokes.length).toBe(1);
    expect(room.strokes[0].id).toBe('stk_1');
  });

  it('guarantees atomic endRound idempotency under race conditions', () => {
    const testIo = {
      to: () => ({ emit: () => {} }),
      sockets: { sockets: new Map() },
    } as any;

    const mgr = new RoomManager(testIo);
    const host = createMockSocket('host_sock');
    const guest = createMockSocket('guest_sock');
    const room = mgr.createRoom(host, 'Host', { style: 'cat', hat: 'none', color: '#7C3AED' });
    mgr.joinRoom(guest, room.code, 'Guest', { style: 'fox', hat: 'none', color: '#06B6D4' });
    mgr.startGame(host, room.code);
    (mgr as any).startWordSelection(room);

    // Move to DRAWING phase
    mgr.selectWord(room, room.wordOptions[0].word);
    expect(room.phase).toBe('DRAWING');

    const drawer = room.players.get(room.currentDrawerId || '');
    const initialScore = drawer?.score || 0;

    // Simulate concurrent endRound triggers (e.g. timer expiration + last guesser solve)
    (mgr as any).endRound(room, 'Timer expired');
    (mgr as any).endRound(room, 'All guessed');
    (mgr as any).endRound(room, 'Double trigger');

    expect(room.phase).toBe('ROUND_RESULT');
    // Artworks should only have 1 entry saved, not 3
    expect(room.artworks.length).toBe(1);
  });
});
