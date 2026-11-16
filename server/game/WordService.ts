import { WordOption } from '../../shared/types.js';

export interface WordDefinition {
  word: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export class WordService {
  private static defaultWords: WordDefinition[] = [
    // Everyday Objects
    { word: 'Pencil', category: 'Everyday Objects', difficulty: 'easy' },
    { word: 'Backpack', category: 'Everyday Objects', difficulty: 'easy' },
    { word: 'Clock', category: 'Everyday Objects', difficulty: 'easy' },
    { word: 'Toaster', category: 'Everyday Objects', difficulty: 'easy' },
    { word: 'Scissors', category: 'Everyday Objects', difficulty: 'easy' },
    { word: 'Headphones', category: 'Everyday Objects', difficulty: 'medium' },
    { word: 'Microscope', category: 'Everyday Objects', difficulty: 'medium' },
    { word: 'Telescope', category: 'Everyday Objects', difficulty: 'medium' },
    { word: 'Hourglass', category: 'Everyday Objects', difficulty: 'medium' },
    { word: 'Gramophone', category: 'Everyday Objects', difficulty: 'hard' },
    { word: 'Cuckoo Clock', category: 'Everyday Objects', difficulty: 'hard' },
    { word: 'Kaleidoscope', category: 'Everyday Objects', difficulty: 'hard' },

    // Animals & Nature
    { word: 'Cat', category: 'Animals & Nature', difficulty: 'easy' },
    { word: 'Penguin', category: 'Animals & Nature', difficulty: 'easy' },
    { word: 'Elephant', category: 'Animals & Nature', difficulty: 'easy' },
    { word: 'Giraffe', category: 'Animals & Nature', difficulty: 'easy' },
    { word: 'Sunflower', category: 'Animals & Nature', difficulty: 'easy' },
    { word: 'Flamingo', category: 'Animals & Nature', difficulty: 'medium' },
    { word: 'Kangaroo', category: 'Animals & Nature', difficulty: 'medium' },
    { word: 'Chameleon', category: 'Animals & Nature', difficulty: 'medium' },
    { word: 'Volcano', category: 'Animals & Nature', difficulty: 'medium' },
    { word: 'Jellyfish', category: 'Animals & Nature', difficulty: 'medium' },
    { word: 'Platypus', category: 'Animals & Nature', difficulty: 'hard' },
    { word: 'Bioluminescence', category: 'Animals & Nature', difficulty: 'hard' },
    { word: 'Hummingbird', category: 'Animals & Nature', difficulty: 'hard' },

    // Places & Rides
    { word: 'Castle', category: 'Places & Rides', difficulty: 'easy' },
    { word: 'Bridge', category: 'Places & Rides', difficulty: 'easy' },
    { word: 'Ferris Wheel', category: 'Places & Rides', difficulty: 'medium' },
    { word: 'Rollercoaster', category: 'Places & Rides', difficulty: 'hard' },
    { word: 'Lighthouse', category: 'Places & Rides', difficulty: 'medium' },
    { word: 'Space Station', category: 'Places & Rides', difficulty: 'hard' },
    { word: 'Submarine', category: 'Places & Rides', difficulty: 'medium' },
    { word: 'Treehouse', category: 'Places & Rides', difficulty: 'easy' },
    { word: 'Pyramids', category: 'Places & Rides', difficulty: 'medium' },

    // Food & Treats
    { word: 'Pizza', category: 'Food & Treats', difficulty: 'easy' },
    { word: 'Cupcake', category: 'Food & Treats', difficulty: 'easy' },
    { word: 'Ice Cream', category: 'Food & Treats', difficulty: 'easy' },
    { word: 'Sushi Roll', category: 'Food & Treats', difficulty: 'medium' },
    { word: 'Pineapple', category: 'Food & Treats', difficulty: 'medium' },
    { word: 'Croissant', category: 'Food & Treats', difficulty: 'medium' },
    { word: 'Cotton Candy', category: 'Food & Treats', difficulty: 'hard' },
    { word: 'Barbecue Grill', category: 'Food & Treats', difficulty: 'hard' },
  ];

  public static getPointValue(difficulty: 'easy' | 'medium' | 'hard'): number {
    switch (difficulty) {
      case 'easy':
        return 100;
      case 'medium':
        return 250;
      case 'hard':
        return 450;
    }
  }

  public static getRandomWordOptions(customPack?: WordDefinition[]): WordOption[] {
    const pool = customPack && customPack.length >= 3 ? customPack : this.defaultWords;

    const easyPool = pool.filter((w) => w.difficulty === 'easy');
    const medPool = pool.filter((w) => w.difficulty === 'medium');
    const hardPool = pool.filter((w) => w.difficulty === 'hard');

    const pick = (list: WordDefinition[], fallback: WordDefinition[]): WordDefinition => {
      const src = list.length > 0 ? list : fallback;
      return src[Math.floor(Math.random() * src.length)];
    };

    const easy = pick(easyPool, pool);
    let med = pick(medPool, pool);
    while (med.word === easy.word && pool.length > 1) {
      med = pool[Math.floor(Math.random() * pool.length)];
    }
    let hard = pick(hardPool, pool);
    while ((hard.word === easy.word || hard.word === med.word) && pool.length > 2) {
      hard = pool[Math.floor(Math.random() * pool.length)];
    }

    return [
      {
        word: easy.word,
        category: easy.category,
        difficulty: 'easy',
        points: this.getPointValue('easy'),
      },
      {
        word: med.word,
        category: med.category,
        difficulty: 'medium',
        points: this.getPointValue('medium'),
      },
      {
        word: hard.word,
        category: hard.category,
        difficulty: 'hard',
        points: this.getPointValue('hard'),
      },
    ];
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
