import { WordOption } from '../../shared/types.js';
import { wordRepository, DrawableWordRecord } from '../db/WordRepository.js';

export class WordService {
  public static getPointValue(difficulty: 'easy' | 'medium' | 'hard'): number {
    return wordRepository.getPointValue(difficulty);
  }

  /**
   * Authoritative word option selection.
   * Guarantees strict difficulty segregation per Directive Part 3:
   * EASY: Only Easy words, categoryVisible = true
   * MEDIUM: Only Medium words, categoryVisible = false (category hidden)
   * HARD: Only Hard words, categoryVisible = false (category hidden)
   *
   * DO NOT MIX DIFFICULTIES.
   */
  public static getRandomWordOptions(
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    excludedWords: string[] = []
  ): WordOption[] {
    return wordRepository.getRandomWordOptions(difficulty, 3, excludedWords);
  }

  public static generateInitialClue(word: string): string {
    return word
      .split('')
      .map((char) => (char === ' ' ? ' ' : '_'))
      .join(' ');
  }

  public static generateHintClue(word: string, revealedPercentage: number): string {
    const chars = word.split('');
    const nonSpaceIndices: number[] = [];
    chars.forEach((c, idx) => {
      if (c !== ' ') nonSpaceIndices.push(idx);
    });

    const targetReveals = Math.min(
      nonSpaceIndices.length - 1,
      Math.max(1, Math.floor(nonSpaceIndices.length * revealedPercentage))
    );

    // Deterministically pick letter positions (first letter + spaced letters)
    const revealedIndices = new Set<number>();
    if (nonSpaceIndices.length > 0) {
      revealedIndices.add(nonSpaceIndices[0]);
    }

    // Pick subsequent indices based on step size
    if (targetReveals > 1 && nonSpaceIndices.length > 2) {
      const step = Math.floor(nonSpaceIndices.length / targetReveals);
      for (let i = 1; i < targetReveals; i++) {
        const idx = nonSpaceIndices[Math.min(nonSpaceIndices.length - 1, i * step)];
        revealedIndices.add(idx);
      }
    }

    return chars
      .map((c, idx) => {
        if (c === ' ') return ' ';
        if (revealedIndices.has(idx)) return c.toUpperCase();
        return '_';
      })
      .join(' ');
  }
}
