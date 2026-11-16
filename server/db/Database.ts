import fs from 'fs';
import path from 'path';

export interface DBPlayer {
  id: string;
  nickname: string;
  avatarStyle: string;
  avatarHat: string;
  avatarColor: string;
  level: number;
  xp: number;
  eloRating: number;
  rankTier: string;
  totalGames: number;
  totalWins: number;
  perfectDrawings: number;
  fastestGuessMs: number | null;
  createdAt: number;
}

export interface DBMatch {
  id: string;
  roomCode: string;
  mode: string;
  totalRounds: number;
  winnerId: string | null;
  startedAt: number;
  endedAt: number;
  participants: Array<{
    playerId: string;
    nickname: string;
    finalScore: number;
    finalRank: number;
    correctGuesses: number;
    eloDelta: number;
  }>;
}

export interface DBArtwork {
  id: string;
  matchId: string;
  roundNumber: number;
  drawerId: string;
  drawerName: string;
  secretWord: string;
  category: string;
  strokeCount: number;
  dataUrl?: string;
  likesCount: number;
  createdAt: number;
}

export class Database {
  private dbPath: string;
  private data: {
    players: Record<string, DBPlayer>;
    matches: DBMatch[];
    artworks: DBArtwork[];
  };

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = path.join(dataDir, 'doodle_arena.json');
    this.data = this.load();
    this.seedDefaultsIfEmpty();
  }

  private load() {
    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse DB, using empty fallback', e);
      }
    }
    return {
      players: {},
      matches: [],
      artworks: [],
    };
  }

  public save() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save DB', e);
    }
  }

  private seedDefaultsIfEmpty() {
    if (Object.keys(this.data.players).length === 0) {
      // Seed weekly top doodlers matching Stitch design
      this.upsertPlayer({
        id: 'ply_seed_1',
        nickname: 'DoodleQueen',
        avatarStyle: 'fox',
        avatarHat: 'beret',
        avatarColor: '#F59E0B',
        level: 48,
        xp: 18420,
        eloRating: 2150,
        rankTier: 'Master I',
        totalGames: 348,
        totalWins: 342,
        perfectDrawings: 45,
        fastestGuessMs: 1420,
        createdAt: Date.now() - 86400000 * 30,
      });

      this.upsertPlayer({
        id: 'ply_seed_2',
        nickname: 'NeonSketcher',
        avatarStyle: 'robot',
        avatarHat: 'headphones',
        avatarColor: '#06B6D4',
        level: 42,
        xp: 16190,
        eloRating: 1980,
        rankTier: 'Diamond II',
        totalGames: 300,
        totalWins: 289,
        perfectDrawings: 38,
        fastestGuessMs: 1850,
        createdAt: Date.now() - 86400000 * 25,
      });

      this.upsertPlayer({
        id: 'ply_seed_3',
        nickname: 'BananaCanvas',
        avatarStyle: 'monkey',
        avatarHat: 'cap',
        avatarColor: '#EAB308',
        level: 38,
        xp: 14880,
        eloRating: 1840,
        rankTier: 'Diamond IV',
        totalGames: 260,
        totalWins: 245,
        perfectDrawings: 31,
        fastestGuessMs: 2100,
        createdAt: Date.now() - 86400000 * 20,
      });

      this.upsertPlayer({
        id: 'ply_seed_4',
        nickname: 'SpeedyPencil_99',
        avatarStyle: 'cat',
        avatarHat: 'beret',
        avatarColor: '#7C3AED',
        level: 24,
        xp: 1420,
        eloRating: 1450,
        rankTier: 'Gold II',
        totalGames: 35,
        totalWins: 22,
        perfectDrawings: 8,
        fastestGuessMs: 2400,
        createdAt: Date.now() - 86400000 * 5,
      });

      this.save();
    }
  }

  public getPlayer(id: string): DBPlayer | undefined {
    return this.data.players[id];
  }

  public getPlayerByNickname(nickname: string): DBPlayer | undefined {
    return Object.values(this.data.players).find(
      (p) => p.nickname.toLowerCase() === nickname.toLowerCase()
    );
  }

  public upsertPlayer(player: DBPlayer): DBPlayer {
    this.data.players[player.id] = player;
    this.save();
    return player;
  }

  public getTopPlayers(limit = 100): DBPlayer[] {
    return Object.values(this.data.players)
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit);
  }

  public getRankedLeaderboard(limit = 100): DBPlayer[] {
    return Object.values(this.data.players)
      .sort((a, b) => b.eloRating - a.eloRating)
      .slice(0, limit);
  }

  public saveMatch(match: DBMatch) {
    this.data.matches.unshift(match);
    if (this.data.matches.length > 500) {
      this.data.matches.pop();
    }

    // Update player stats
    for (const part of match.participants) {
      const p = this.data.players[part.playerId];
      if (p) {
        p.totalGames += 1;
        if (part.finalRank === 1) p.totalWins += 1;
        p.xp += part.finalScore;
        p.level = Math.floor(1 + Math.sqrt(p.xp / 100));
        p.eloRating = Math.max(500, p.eloRating + part.eloDelta);
      }
    }

    this.save();
  }

  public getPlayerMatches(playerId: string, limit = 10): DBMatch[] {
    return this.data.matches
      .filter((m) => m.participants.some((p) => p.playerId === playerId))
      .slice(0, limit);
  }

  public saveArtwork(art: DBArtwork) {
    this.data.artworks.unshift(art);
    if (this.data.artworks.length > 200) {
      this.data.artworks.pop();
    }
    this.save();
  }

  public getRecentArtworks(limit = 20): DBArtwork[] {
    return this.data.artworks.slice(0, limit);
  }
}

export const db = new Database();
