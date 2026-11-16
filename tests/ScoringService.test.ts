import { describe, it, expect } from 'vitest';
import { ScoringService } from '../server/game/ScoringService.js';

describe('ScoringService', () => {
  it('awards base difficulty points correctly', () => {
    // Easy: 100 base
    const easy = ScoringService.calculateGuesserScore(100, 0, 80, 2);
    expect(easy.basePoints).toBe(100);
    expect(easy.totalPoints).toBe(100);

    // Medium: 250 base
    const med = ScoringService.calculateGuesserScore(250, 0, 80, 2);
    expect(med.basePoints).toBe(250);
    expect(med.totalPoints).toBe(250);

    // Hard: 450 base
    const hard = ScoringService.calculateGuesserScore(450, 0, 80, 2);
    expect(hard.basePoints).toBe(450);
    expect(hard.totalPoints).toBe(450);
  });

  it('calculates speed bonus and 1st place bonus properly', () => {
    // Guessing with full time left (80/80) as 1st guesser (index 0)
    // Speed bonus: 250 * 0.8 = 200
    // 1st place bonus: 250 * 0.2 = 50
    // Total: 250 + 200 + 50 = 500
    const result = ScoringService.calculateGuesserScore(250, 80, 80, 0);
    expect(result.speedBonus).toBe(200);
    expect(result.rankBonus).toBe(50);
    expect(result.totalPoints).toBe(500);
  });

  it('calculates drawer rewards based on guesser scores', () => {
    // If guessers earned [500, 300], avg is 400. Drawer gets 50% = 200
    const reward = ScoringService.calculateDrawerReward([500, 300], 3);
    expect(reward).toBe(200);

    // If all guessers in the room solved, drawer gets +100 Masterpiece bonus!
    const perfectReward = ScoringService.calculateDrawerReward([500, 300], 2);
    expect(perfectReward).toBe(300); // 200 + 100
  });

  it('returns 0 points for drawer when no one guessed', () => {
    const zero = ScoringService.calculateDrawerReward([], 3);
    expect(zero).toBe(0);
  });
});
