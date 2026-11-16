export interface GuessEvaluation {
  isCorrect: boolean;
  isClose: boolean;
  cleanGuess: string;
}

export class GuessService {
  public static normalize(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[\-_]/g, ' ')
      .replace(/['\.,!?:;"]/g, '')
      .replace(/\s+/g, ' ');
  }

  public static levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(
              matrix[i][j - 1] + 1,     // insertion
              matrix[i - 1][j] + 1      // deletion
            )
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  public static evaluateGuess(rawGuess: string, secretWord: string): GuessEvaluation {
    const cleanGuess = this.normalize(rawGuess);
    const cleanSecret = this.normalize(secretWord);

    if (!cleanGuess) {
      return { isCorrect: false, isClose: false, cleanGuess: '' };
    }

    if (
      cleanGuess === cleanSecret ||
      cleanGuess.replace(/\s+/g, '') === cleanSecret.replace(/\s+/g, '')
    ) {
      return { isCorrect: true, isClose: false, cleanGuess };
    }

    const distance = this.levenshteinDistance(cleanGuess, cleanSecret);
    const maxThreshold = cleanSecret.length >= 7 ? 2 : 1;
    const isClose = distance > 0 && distance <= maxThreshold;

    return {
      isCorrect: false,
      isClose,
      cleanGuess,
    };
  }
}
