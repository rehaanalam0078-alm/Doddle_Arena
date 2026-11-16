import { describe, it, expect } from 'vitest';
import { WordService } from '../server/game/WordService.js';
import { wordRepository } from '../server/db/WordRepository.js';

describe('WordService & Word Database Integration', () => {
  it('generates 3 word options matching room difficulty without mixing', () => {
    // Easy mode
    const easyOptions = WordService.getRandomWordOptions('easy');
    expect(easyOptions).toHaveLength(3);
    for (const opt of easyOptions) {
      expect(opt.difficulty).toBe('easy');
      expect(opt.points).toBe(100);
      expect(opt.categoryVisible).toBe(true);
      expect(opt.category).toBeTruthy();
    }

    // Medium mode
    const mediumOptions = WordService.getRandomWordOptions('medium');
    expect(mediumOptions).toHaveLength(3);
    for (const opt of mediumOptions) {
      expect(opt.difficulty).toBe('medium');
      expect(opt.points).toBe(250);
      expect(opt.categoryVisible).toBe(false); // Hidden from guessers
    }

    // Hard mode
    const hardOptions = WordService.getRandomWordOptions('hard');
    expect(hardOptions).toHaveLength(3);
    for (const opt of hardOptions) {
      expect(opt.difficulty).toBe('hard');
      expect(opt.points).toBe(450);
      expect(opt.categoryVisible).toBe(false); // Hidden from guessers
    }
  });

  it('excludes previously used words in match', () => {
    const initialOptions = WordService.getRandomWordOptions('medium');
    const firstWord = initialOptions[0].word;

    const nextOptions = WordService.getRandomWordOptions('medium', [firstWord]);
    const words = nextOptions.map((o) => o.word.toLowerCase());
    expect(words).not.toContain(firstWord.toLowerCase());
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
