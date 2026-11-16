import { db, DBPlayer } from '../db/Database.js';

export interface RankedQueueEntry {
  socketId: string;
  playerId: string;
  playerName: string;
  elo: number;
  queuedAt: number;
}

export interface RecentBattle {
  id: string;
  opponentName: string;
  opponentAvatar: string;
  result: 'VICTORY' | 'DEFEAT' | 'DRAW';
  score: string;
  eloChange: number;
  secretWord: string;
  date: string;
}

export class CompetitiveService {
  private static queue: RankedQueueEntry[] = [];

  public static enqueue(
    socketId: string,
    playerId: string,
    playerName: string,
    elo = 1450
  ): { position: number; avgWaitSeconds: number } {
    // Remove if already present
    this.dequeue(socketId);

    const entry: RankedQueueEntry = {
      socketId,
      playerId,
      playerName,
      elo,
      queuedAt: Date.now(),
    };
    this.queue.push(entry);

    return {
      position: this.queue.length,
      avgWaitSeconds: 1.8,
    };
  }

  public static dequeue(socketId: string) {
    this.queue = this.queue.filter((e) => e.socketId !== socketId);
  }

  public static getRecentBattles(): RecentBattle[] {
    return [
      {
        id: 'bat_1',
        opponentName: 'NeonSketcher',
        opponentAvatar: 'robot',
        result: 'VICTORY',
        score: '1,420 - 1,180',
        eloChange: +24,
        secretWord: 'Flamingo',
        date: '12m ago',
      },
      {
        id: 'bat_2',
        opponentName: 'DoodleQueen',
        opponentAvatar: 'fox',
        result: 'DEFEAT',
        score: '980 - 1,350',
        eloChange: -18,
        secretWord: 'Rollercoaster',
        date: '48m ago',
      },
      {
        id: 'bat_3',
        opponentName: 'BananaCanvas',
        opponentAvatar: 'monkey',
        result: 'VICTORY',
        score: '1,290 - 890',
        eloChange: +22,
        secretWord: 'Submarine',
        date: '2h ago',
      },
      {
        id: 'bat_4',
        opponentName: 'ChalkNinja',
        opponentAvatar: 'cat',
        result: 'VICTORY',
        score: '1,100 - 950',
        eloChange: +16,
        secretWord: 'Kaleidoscope',
        date: '5h ago',
      },
    ];
  }
}
