export type AvatarStyle = 'cat' | 'robot' | 'fox' | 'monkey' | 'panda' | 'bear';
export type AvatarHat = 'none' | 'beret' | 'headphones' | 'crown' | 'cap' | 'sunglasses';

export interface PlayerAvatar {
  style: AvatarStyle;
  hat: AvatarHat;
  color: string;
}

export interface Player {
  id: string;
  socketId: string;
  name: string;
  avatar: PlayerAvatar;
  score: number;
  rank: number;
  isHost: boolean;
  isReady: boolean;
  isDrawing: boolean;
  hasGuessed: boolean;
  correctGuessRank?: number;
  guessTimeMs?: number;
  isDisconnected?: boolean;
}

export interface RoomSettings {
  isPrivate: boolean;
  maxPlayers: number;
  rounds: number;
  drawTimeSeconds: 60 | 80 | 100 | 120;
  difficulty: 'easy' | 'medium' | 'hard';
  wordPackId: string;
  language: string;
}

export type GamePhase =
  | 'LOBBY'
  | 'COUNTDOWN'
  | 'WORD_SELECTION'
  | 'DRAWING'
  | 'ROUND_RESULT'
  | 'MATCH_RESULT';

export interface WordOption {
  word: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export type DrawingTool = 'brush' | 'eraser' | 'fill' | 'line' | 'rectangle' | 'circle';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  tool: DrawingTool;
  color: string;
  size: number;
  points: Point[];
  seq: number;
  timestamp?: number;
  turnId?: string;
}

export interface ArtworkRecord {
  round: number;
  drawerId: string;
  drawerName: string;
  word: string;
  category: string;
  strokes: Stroke[];
  likes: number;
}

export interface ChatMessage {
  id: string;
  playerId?: string;
  playerName: string;
  text: string;
  type: 'normal' | 'close' | 'correct' | 'system' | 'cheer';
  timestamp: number;
  reactionIcon?: string;
  turnId?: string;
  roundNumber?: number;
}

export interface RoomState {
  code: string;
  hostId: string;
  settings: RoomSettings;
  players: Player[];
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  turnId?: string;
  currentDrawerId: string | null;
  drawerName?: string;
  timerStart: number;
  timerEnd: number;
  durationSeconds: number;
  clue: string;
  category: string;
  letterCount: number;
  difficultyPoints: number;
  secretWord?: string;
  winnerId?: string;
  rematchVotes?: string[];
  artworks: ArtworkRecord[];
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  bracketRound: 'round_16' | 'quarterfinals' | 'semifinals' | 'finals';
  matchIndex: number;
  player1: { id: string; name: string; avatar: PlayerAvatar; score: number };
  player2: { id: string; name: string; avatar: PlayerAvatar; score: number };
  winnerId?: string;
  status: 'live' | 'upcoming' | 'completed';
  roomCode?: string;
}

export interface Tournament {
  id: string;
  title: string;
  stage: string;
  status: 'live' | 'upcoming' | 'completed';
  prizePool: string;
  participantCount: number;
  matches: TournamentMatch[];
}
