export interface GuesserScoreResult {
  basePoints: number;
  speedBonus: number;
  rankBonus: number;
  totalPoints: number;
}

export class ScoringService {
  public static calculateGuesserScore(
    baseDifficultyPoints: number,
    remainingSeconds: number,
    totalDurationSeconds: number,
    guessOrderIndex: number // 0 for 1st guesser, 1 for 2nd, etc.
  ): GuesserScoreResult {
    const timeFraction = Math.max(0, Math.min(1, remainingSeconds / totalDurationSeconds));
    // Speed bonus: up to +80% for instant guesses
    const speedBonus = Math.round(baseDifficultyPoints * (timeFraction * 0.8));

    // Guess order bonus: 1st gets +20%, 2nd gets +10%
    let orderMultiplier = 0;
    if (guessOrderIndex === 0) {
      orderMultiplier = 0.2;
    } else if (guessOrderIndex === 1) {
      orderMultiplier = 0.1;
    }
    const rankBonus = Math.round(baseDifficultyPoints * orderMultiplier);

    const totalPoints = baseDifficultyPoints + speedBonus + rankBonus;

    return {
      basePoints: baseDifficultyPoints,
      speedBonus,
      rankBonus,
      totalPoints,
    };
  }

  public static calculateDrawerReward(
    guesserScores: number[],
    totalGuessersInRoom: number
  ): number {
    if (guesserScores.length === 0) {
      return 0; // No one guessed the drawing
    }

    const sum = guesserScores.reduce((acc, score) => acc + score, 0);
    const avgScore = sum / guesserScores.length;

    // Drawer earns 50% of average guesser score
    let drawerPoints = Math.round(avgScore * 0.5);

    // Masterpiece bonus: if everyone in the room guessed it!
    if (totalGuessersInRoom > 0 && guesserScores.length >= totalGuessersInRoom) {
      drawerPoints += 100;
    }

    return drawerPoints;
  }
}
