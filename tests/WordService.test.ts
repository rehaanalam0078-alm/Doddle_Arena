import { describe, it, expect } from 'vitest';
import { WordService } from '../server/game/WordService.js';

describe('WordService', () => {
  it('generates 3 tiered word options: easy, medium, and hard', () => {
    const options = WordService.getRandomWordOptions();
    expect(options).toHaveLength(3);

    const easy = options.find((o) => o.difficulty === 'easy');
    const med = options.find((o) => o.difficulty === 'medium');
    const hard = options.find((o) => o.difficulty === 'hard');

    expect(easy).toBeDefined();
    expect(easy?.points).toBe(100);

    expect(med).toBeDefined();
    expect(med?.points).toBe(250);

    expect(hard).toBeDefined();
    expect(hard?.points).toBe(450);

    // Words should be non-empty strings
    expect(easy?.word.length).toBeGreaterThan(0);
    expect(med?.word.length).toBeGreaterThan(0);
    expect(hard?.word.length).toBeGreaterThan(0);
  });

  it('generates masked initial clues matching word length', () => {
    const clue = WordService.generateInitialClue('Cat');
    expect(clue).toBe('_ _ _');

    const multiWordClue = WordService.generateInitialClue('Ice Cream');
    expect(multiWordClue).toBe('_ _ _   _ _ _ _ _');
  });

  it('generates progressive letter reveals without leaking entire word', () => {
    const word = 'Flamingo';
    const hint25 = WordService.generateHintClue(word, 0.25);
    expect(hint25.includes('F')).toBe(true);
    expect(hint25.includes('_')).toBe(true);

    const hint50 = WordService.generateHintClue(word, 0.5);
    expect(hint50.includes('F')).toBe(true);
    expect(hint50.includes('_')).toBe(true);
  });
});
