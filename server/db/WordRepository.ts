import fs from 'fs';
import path from 'path';
import { WordOption } from '../../shared/types.js';

export interface DrawableWordRecord {
  id: string;
  word: string;
  normalized_word: string;
  sense_id?: string;
  language: string;
  part_of_speech?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  subcategory?: string;
  category_visible?: boolean;
  drawability_type: string;
  visual_complexity?: number;
  word_length: number;
  word_count: number;
  syllable_count?: number;
  aliases: string[];
  regional_variants: string[];
  gloss?: string;
  is_child_friendly: boolean;
  is_validated: boolean;
  source_ids?: string[];
  dataset_version: string;
  status: 'active' | 'candidate_review';
  origin?: string;
  review_recommendation?: string;
}

export class WordRepository {
  private static instance: WordRepository;
  private activePath: string;
  private candidatePath: string;
  private metadataPath: string;

  private activeWords: Map<string, DrawableWordRecord> = new Map();
  private candidateWords: Map<string, DrawableWordRecord> = new Map();
  private wordsByDifficulty: {
    easy: DrawableWordRecord[];
    medium: DrawableWordRecord[];
    hard: DrawableWordRecord[];
  } = { easy: [], medium: [], hard: [] };

  // Lookup maps for aliases & normalized forms
  private wordToAliases: Map<string, Set<string>> = new Map();
  private aliasToCanonical: Map<string, Set<string>> = new Map();

  private constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    this.activePath = path.join(dataDir, 'word_bank_active.json');
    this.candidatePath = path.join(dataDir, 'word_bank_candidates.json');
    this.metadataPath = path.join(dataDir, 'word_bank_metadata.json');

    this.loadFromDisk();
  }

  public static getInstance(): WordRepository {
    if (!WordRepository.instance) {
      WordRepository.instance = new WordRepository();
    }
    return WordRepository.instance;
  }

  private loadFromDisk() {
    // Check if active file exists, if not load from root drawable_word_bank_v2.json
    let activeEntries: DrawableWordRecord[] = [];
    let candidateEntries: DrawableWordRecord[] = [];

    if (fs.existsSync(this.activePath)) {
      try {
        const raw = fs.readFileSync(this.activePath, 'utf-8');
        activeEntries = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to load active word bank:', e);
      }
    }

    if (fs.existsSync(this.candidatePath)) {
      try {
        const raw = fs.readFileSync(this.candidatePath, 'utf-8');
        candidateEntries = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to load candidate word bank:', e);
      }
    }

    // Fallback: If data directory was unpopulated, load directly from source
    if (activeEntries.length === 0) {
      const sourceFile = path.resolve(process.cwd(), 'drawable_word_bank_v2.json');
      if (fs.existsSync(sourceFile)) {
        try {
          const raw = fs.readFileSync(sourceFile, 'utf-8');
          const data = JSON.parse(raw);
          const entries: DrawableWordRecord[] = data.entries || [];
          for (const entry of entries) {
            if (entry.status === 'active') {
              activeEntries.push(entry);
            } else {
              candidateEntries.push(entry);
            }
          }
        } catch (e) {
          console.error('Failed to parse root word bank fallback:', e);
        }
      }
    }

    this.reindex(activeEntries, candidateEntries);
  }

  private reindex(active: DrawableWordRecord[], candidates: DrawableWordRecord[]) {
    this.activeWords.clear();
    this.candidateWords.clear();
    this.wordsByDifficulty = { easy: [], medium: [], hard: [] };
    this.wordToAliases.clear();
    this.aliasToCanonical.clear();

    for (const record of active) {
      this.activeWords.set(record.id, record);
      const diff = record.difficulty || 'medium';
      if (this.wordsByDifficulty[diff]) {
        this.wordsByDifficulty[diff].push(record);
      }

      // Build normalized alias lookups
      const normCanonical = record.normalized_word.toLowerCase().trim();
      const validAliases = new Set<string>([normCanonical]);

      if (Array.isArray(record.aliases)) {
        for (const alias of record.aliases) {
          const normAlias = alias.toLowerCase().trim();
          if (normAlias) {
            validAliases.add(normAlias);
            if (!this.aliasToCanonical.has(normAlias)) {
              this.aliasToCanonical.set(normAlias, new Set());
            }
            this.aliasToCanonical.get(normAlias)!.add(normCanonical);
          }
        }
      }

      if (Array.isArray(record.regional_variants)) {
        for (const variant of record.regional_variants) {
          const normVariant = variant.toLowerCase().trim();
          if (normVariant) {
            validAliases.add(normVariant);
            if (!this.aliasToCanonical.has(normVariant)) {
              this.aliasToCanonical.set(normVariant, new Set());
            }
            this.aliasToCanonical.get(normVariant)!.add(normCanonical);
          }
        }
      }

      this.wordToAliases.set(normCanonical, validAliases);
    }

    for (const record of candidates) {
      this.candidateWords.set(record.id, record);
    }

    console.log(
      `📚 WordRepository Indexed: ${this.activeWords.size} active (Easy: ${this.wordsByDifficulty.easy.length}, Med: ${this.wordsByDifficulty.medium.length}, Hard: ${this.wordsByDifficulty.hard.length}), ${this.candidateWords.size} candidates.`
    );
  }

  public getActiveWords(difficulty?: 'easy' | 'medium' | 'hard'): DrawableWordRecord[] {
    if (difficulty && this.wordsByDifficulty[difficulty]) {
      return [...this.wordsByDifficulty[difficulty]];
    }
    return Array.from(this.activeWords.values());
  }

  public getPointValue(difficulty: 'easy' | 'medium' | 'hard'): number {
    switch (difficulty) {
      case 'easy':
        return 100;
      case 'medium':
        return 250;
      case 'hard':
        return 450;
    }
  }

  /**
   * Secure backend word selection.
   * Guarantees strict difficulty segregation:
   * Easy match -> ONLY Easy words
   * Medium match -> ONLY Medium words
   * Hard match -> ONLY Hard words
   */
  public getRandomWordOptions(
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    count: number = 3,
    excludedWords: string[] = []
  ): WordOption[] {
    const pool = this.wordsByDifficulty[difficulty] || this.wordsByDifficulty.medium;
    if (pool.length === 0) {
      return [];
    }

    const normalizedExcluded = new Set(
      excludedWords.map((w) => w.toLowerCase().trim())
    );

    // Filter available pool
    const available = pool.filter((w) => !normalizedExcluded.has(w.normalized_word.toLowerCase().trim()));
    const candidatePool = available.length >= count ? available : pool;

    const selectedWords: DrawableWordRecord[] = [];
    const usedWordBases = new Set<string>();
    const usedCategories = new Set<string>();

    // Shuffle copy of candidate pool
    const shuffled = [...candidatePool].sort(() => 0.5 - Math.random());

    for (const record of shuffled) {
      const baseWord = record.normalized_word.toLowerCase().trim();
      // Avoid duplicate base concepts in same 3 choices (e.g. polysemous bat/tent)
      if (usedWordBases.has(baseWord)) continue;

      // Prefer distinct categories for variety when possible
      if (selectedWords.length < count - 1 && usedCategories.has(record.category) && candidatePool.length > 20) {
        continue;
      }

      selectedWords.push(record);
      usedWordBases.add(baseWord);
      usedCategories.add(record.category);

      if (selectedWords.length >= count) break;
    }

    // Fallback if strict category filtering didn't reach count
    if (selectedWords.length < count) {
      for (const record of shuffled) {
        const baseWord = record.normalized_word.toLowerCase().trim();
        if (!usedWordBases.has(baseWord)) {
          selectedWords.push(record);
          usedWordBases.add(baseWord);
          if (selectedWords.length >= count) break;
        }
      }
    }

    // Format options with difficulty rules
    // Easy: category is visible
    // Medium & Hard: category is HIDDEN from guessers (categoryVisible = false)
    const isCategoryVisible = difficulty === 'easy';

    return selectedWords.map((r) => ({
      id: r.id,
      word: r.word,
      category: r.category,
      categoryVisible: isCategoryVisible,
      difficulty: r.difficulty,
      points: this.getPointValue(r.difficulty),
      wordLength: r.word_length || r.word.replace(/\s+/g, '').length,
    }));
  }

  /**
   * Evaluates if guess matches secret word or any approved alias/variant.
   */
  public isMatchingGuess(guess: string, secretWord: string): boolean {
    const normGuess = guess.toLowerCase().replace(/[\s\-_]/g, '').trim();
    const normSecret = secretWord.toLowerCase().replace(/[\s\-_]/g, '').trim();

    if (normGuess === normSecret) return true;

    // Check alias mapping
    const rawSecretNorm = secretWord.toLowerCase().trim();
    const aliases = this.wordToAliases.get(rawSecretNorm);
    if (aliases) {
      for (const alias of aliases) {
        const normAlias = alias.replace(/[\s\-_]/g, '').trim();
        if (normGuess === normAlias) return true;
      }
    }

    return false;
  }

  public getAliasesForWord(secretWord: string): string[] {
    const rawSecretNorm = secretWord.toLowerCase().trim();
    const set = this.wordToAliases.get(rawSecretNorm);
    return set ? Array.from(set) : [];
  }

  public getStats() {
    return {
      version: '2.0.0',
      totalRecords: this.activeWords.size + this.candidateWords.size,
      activeRecords: this.activeWords.size,
      candidateRecords: this.candidateWords.size,
      difficulty: {
        easy: this.wordsByDifficulty.easy.length,
        medium: this.wordsByDifficulty.medium.length,
        hard: this.wordsByDifficulty.hard.length,
      },
      categoriesCount: new Set(
        Array.from(this.activeWords.values()).map((w) => w.category)
      ).size,
    };
  }

  public getCandidates(page = 1, limit = 50): { total: number; page: number; limit: number; candidates: DrawableWordRecord[] } {
    const all = Array.from(this.candidateWords.values());
    const start = (page - 1) * limit;
    const paged = all.slice(start, start + limit);
    return {
      total: all.length,
      page,
      limit,
      candidates: paged,
    };
  }

  public approveCandidate(id: string): boolean {
    const record = this.candidateWords.get(id);
    if (!record) return false;

    record.status = 'active';
    this.candidateWords.delete(id);
    this.activeWords.set(id, record);

    if (this.wordsByDifficulty[record.difficulty]) {
      this.wordsByDifficulty[record.difficulty].push(record);
    }

    this.saveToDisk();
    return true;
  }

  public rejectCandidate(id: string): boolean {
    if (!this.candidateWords.has(id)) return false;
    this.candidateWords.delete(id);
    this.saveToDisk();
    return true;
  }

  private saveToDisk() {
    try {
      const activeList = Array.from(this.activeWords.values());
      const candidateList = Array.from(this.candidateWords.values());

      fs.writeFileSync(this.activePath, JSON.stringify(activeList, null, 2), 'utf-8');
      fs.writeFileSync(this.candidatePath, JSON.stringify(candidateList, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist word bank update to disk:', e);
    }
  }
}

export const wordRepository = WordRepository.getInstance();
