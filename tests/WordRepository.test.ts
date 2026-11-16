import { describe, it, expect } from 'vitest';
import { wordRepository } from '../server/db/WordRepository.js';
import { GuessService } from '../server/game/GuessService.js';

describe('WordRepository (Expanded English Database v2.0.0)', () => {
  it('correctly indexes active production pool and candidate review pool', () => {
    const stats = wordRepository.getStats();
    expect(stats.version).toBe('2.0.0');
    expect(stats.totalRecords).toBe(2746);
    expect(stats.activeRecords).toBe(2124);
    expect(stats.candidateRecords).toBe(622);

    // Verify difficulty counts in active pool
    expect(stats.difficulty.easy).toBe(680);
    expect(stats.difficulty.medium).toBe(1040);
    expect(stats.difficulty.hard).toBe(404);
  });

  it('enforces strict difficulty segregation in random word selection', () => {
    // Easy pool only
    const easyWords = wordRepository.getRandomWordOptions('easy', 5);
    expect(easyWords).toHaveLength(5);
    for (const w of easyWords) {
      expect(w.difficulty).toBe('easy');
      expect(w.categoryVisible).toBe(true);
    }

    // Medium pool only
    const mediumWords = wordRepository.getRandomWordOptions('medium', 5);
    expect(mediumWords).toHaveLength(5);
    for (const w of mediumWords) {
      expect(w.difficulty).toBe('medium');
      expect(w.categoryVisible).toBe(false);
    }

    // Hard pool only
    const hardWords = wordRepository.getRandomWordOptions('hard', 5);
    expect(hardWords).toHaveLength(5);
    for (const w of hardWords) {
      expect(w.difficulty).toBe('hard');
      expect(w.categoryVisible).toBe(false);
    }
  });

  it('matches approved aliases and regional variants in GuessService', () => {
    // Test alias evaluation
    // E.g., if secret word has an alias or space/hyphen differences
    const testSecret = 'ice cream';
    const eval1 = GuessService.evaluateGuess('icecream', testSecret);
    expect(eval1.isCorrect).toBe(true);

    const eval2 = GuessService.evaluateGuess('ice cream', testSecret);
    expect(eval2.isCorrect).toBe(true);

    const eval3 = GuessService.evaluateGuess('ice-cream', testSecret);
    expect(eval3.isCorrect).toBe(true);

    // Test rejection of completely incorrect words
    const evalFalse = GuessService.evaluateGuess('pizza', testSecret);
    expect(evalFalse.isCorrect).toBe(false);
  });

  it('correctly provides paged candidate records for review', () => {
    const paged = wordRepository.getCandidates(1, 10);
    expect(paged.total).toBe(622);
    expect(paged.candidates).toHaveLength(10);
    expect(paged.page).toBe(1);

    for (const cand of paged.candidates) {
      expect(cand.status).toBe('candidate_review');
    }
  });
});
