import { Tournament, TournamentMatch } from '../../shared/types.js';

export class TournamentService {
  private static activeTournament: Tournament = {
    id: 'tourn_summer_masters_2026',
    title: 'Summer Masters Cup 2026',
    stage: 'quarterfinals',
    status: 'live',
    prizePool: '$2,500 + Golden Pencil Trophy',
    participantCount: 16,
    matches: [
      // Quarterfinals
      {
        id: 'qf_1',
        tournamentId: 'tourn_summer_masters_2026',
        bracketRound: 'quarterfinals',
        matchIndex: 1,
        player1: {
          id: 'ply_seed_1',
          name: 'DoodleQueen',
          avatar: { style: 'fox', hat: 'beret', color: '#F59E0B' },
          score: 840,
        },
        player2: {
          id: 'ply_seed_4',
          name: 'SpeedyPencil_99',
          avatar: { style: 'cat', hat: 'beret', color: '#7C3AED' },
          score: 720,
        },
        winnerId: 'ply_seed_1',
        status: 'completed',
        roomCode: 'ROAR-409',
      },
      {
        id: 'qf_2',
        tournamentId: 'tourn_summer_masters_2026',
        bracketRound: 'quarterfinals',
        matchIndex: 2,
        player1: {
          id: 'ply_seed_2',
          name: 'NeonSketcher',
          avatar: { style: 'robot', hat: 'headphones', color: '#06B6D4' },
          score: 650,
        },
        player2: {
          id: 'ply_qf2_b',
          name: 'InkMasterX',
          avatar: { style: 'monkey', hat: 'cap', color: '#10B981' },
          score: 410,
        },
        winnerId: 'ply_seed_2',
        status: 'completed',
        roomCode: 'DRAW-812',
      },
      {
        id: 'qf_3',
        tournamentId: 'tourn_summer_masters_2026',
        bracketRound: 'quarterfinals',
        matchIndex: 3,
        player1: {
          id: 'ply_seed_3',
          name: 'BananaCanvas',
          avatar: { style: 'monkey', hat: 'cap', color: '#EAB308' },
          score: 310,
        },
        player2: {
          id: 'ply_qf3_b',
          name: 'PixelGhost',
          avatar: { style: 'bear', hat: 'crown', color: '#EC4899' },
          score: 290,
        },
        status: 'live',
        roomCode: 'PARTY-ANIMALS',
      },
      {
        id: 'qf_4',
        tournamentId: 'tourn_summer_masters_2026',
        bracketRound: 'quarterfinals',
        matchIndex: 4,
        player1: {
          id: 'ply_qf4_a',
          name: 'ColorBlaster',
          avatar: { style: 'panda', hat: 'none', color: '#6366F1' },
          score: 0,
        },
        player2: {
          id: 'ply_qf4_b',
          name: 'ChalkNinja',
          avatar: { style: 'cat', hat: 'sunglasses', color: '#8B5CF6' },
          score: 0,
        },
        status: 'upcoming',
        roomCode: 'TURBO-104',
      },

      // Semifinals
      {
        id: 'sf_1',
        tournamentId: 'tourn_summer_masters_2026',
        bracketRound: 'semifinals',
        matchIndex: 1,
        player1: {
          id: 'ply_seed_1',
          name: 'DoodleQueen',
          avatar: { style: 'fox', hat: 'beret', color: '#F59E0B' },
          score: 0,
        },
        player2: {
          id: 'ply_seed_2',
          name: 'NeonSketcher',
          avatar: { style: 'robot', hat: 'headphones', color: '#06B6D4' },
          score: 0,
        },
        status: 'upcoming',
        roomCode: 'SEMI-101',
      },
      {
        id: 'sf_2',
        tournamentId: 'tourn_summer_masters_2026',
        bracketRound: 'semifinals',
        matchIndex: 2,
        player1: {
          id: 'tbd_1',
          name: 'Winner of QF 3',
          avatar: { style: 'bear', hat: 'crown', color: '#CBD5E1' },
          score: 0,
        },
        player2: {
          id: 'tbd_2',
          name: 'Winner of QF 4',
          avatar: { style: 'panda', hat: 'none', color: '#CBD5E1' },
          score: 0,
        },
        status: 'upcoming',
        roomCode: 'SEMI-102',
      },

      // Grand Finals
      {
        id: 'gf_1',
        tournamentId: 'tourn_summer_masters_2026',
        bracketRound: 'finals',
        matchIndex: 1,
        player1: {
          id: 'tbd_gf1',
          name: 'Winner SF 1',
          avatar: { style: 'fox', hat: 'crown', color: '#F59E0B' },
          score: 0,
        },
        player2: {
          id: 'tbd_gf2',
          name: 'Winner SF 2',
          avatar: { style: 'robot', hat: 'crown', color: '#06B6D4' },
          score: 0,
        },
        status: 'upcoming',
        roomCode: 'FINALS-GOLD',
      },
    ],
  };

  public static getTournament(): Tournament {
    return this.activeTournament;
  }

  public static registerParticipant(name: string, tag: string): boolean {
    this.activeTournament.participantCount += 1;
    return true;
  }
}
