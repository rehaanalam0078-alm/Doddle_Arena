import { describe, it, expect } from 'vitest';
import { GuessService } from '../server/game/GuessService.js';

describe('GuessService', () => {
  it('normalizes guesses by lowercasing, trimming, and stripping punctuation', () => {
    expect(GuessService.normalize('  Flamingo! ')).toBe('flamingo');
    expect(GuessService.normalize('ROLLER-COASTER')).toBe('roller coaster');
    expect(GuessService.normalize('  ice cream  ')).toBe('ice cream');
  });

  it('correctly identifies exact matches regardless of casing or extra spaces', () => {
    const res1 = GuessService.evaluateGuess('FLAMINGO', 'Flamingo');
    expect(res1.isCorrect).toBe(true);
    expect(res1.isClose).toBe(false);

    const res2 = GuessService.evaluateGuess('  roller-coaster! ', 'Rollercoaster');
    expect(res2.isCorrect).toBe(true);
  });

  it('detects close guesses within Levenshtein distance threshold', () => {
    // 1 typo in 'flamingo' -> 'flamingg'
    const close1 = GuessService.evaluateGuess('flamingg', 'Flamingo');
    expect(close1.isCorrect).toBe(false);
    expect(close1.isClose).toBe(true);

    // 1 typo in 'pencil' -> 'pencel'
    const close2 = GuessService.evaluateGuess('pencel', 'Pencil');
    expect(close2.isCorrect).toBe(false);
    expect(close2.isClose).toBe(true);
  });

  it('rejects completely unrelated words as neither correct nor close', () => {
    const far = GuessService.evaluateGuess('airplane', 'Flamingo');
    expect(far.isCorrect).toBe(false);
    expect(far.isClose).toBe(false);
  });
});
