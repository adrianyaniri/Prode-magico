/**
 * Scoring engine — 5/3/1 system for WC2026 Prode.
 *
 * Rules:
 * - 5 points: exact scoreline
 * - 3 points: correct result (winner or draw) but wrong score
 * - 1 point: correct advancing team (KO round with penalties where 90-min score differs)
 * - 0 points: wrong result
 */

export type MatchOutcome = "home" | "away" | "draw";

/**
 * Determine match outcome from scores.
 */
export function getOutcome(homeScore: number, awayScore: number): MatchOutcome {
  if (homeScore > awayScore) return "home";
  if (awayScore > homeScore) return "away";
  return "draw";
}

/**
 * Calculate points for a single prediction given the actual result.
 *
 * @param predictedHome - User's predicted home goals
 * @param predictedAway - User's predicted away goals
 * @param actualHome - Actual home goals
 * @param actualAway - Actual away goals
 * @param penaltyWinner - Team that advanced on penalties (for KO rounds), or null
 * @param predictedAdvancer - Team the user predicted to advance (for KO rounds), or null
 * @returns Points: 5, 3, 1, or 0
 */
export function calculateScore(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  penaltyWinner: string | null = null,
  predictedAdvancer: string | null = null,
): number {
  // Exact scoreline → 5 points
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return 5;
  }

  const actualOutcome = getOutcome(actualHome, actualAway);
  const predictedOutcome = getOutcome(predictedHome, predictedAway);

  // Correct result (winner or draw) → 3 points
  if (actualOutcome === predictedOutcome) {
    // If this is a KO match that went to penalties, the 90-min score may differ
    // from who advanced. The actual outcome could be a draw even though someone won on pens.
    // In this case, correct result = 3pts still applies for matching the 90-min outcome.
    return 3;
  }

  // Penalty advance: user predicted a team to advance, match went to pens
  if (
    penaltyWinner &&
    predictedAdvancer &&
    predictedAdvancer === penaltyWinner
  ) {
    return 1;
  }

  // Wrong result
  return 0;
}

/**
 * Calculate points when the match went to penalties.
 * The 90-minute score is a draw, but a team advances on penalties.
 * If the user predicted that team to advance, they get 1 point.
 * If they got the 90-minute outcome right (draw), they still get 3 points.
 */
export function calculatePenaltyScore(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  penaltyWinner: string,
  predictedAdvancer: string,
): number {
  // Exact 90-minute scoreline → 5 points (regardless of pens)
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return 5;
  }

  const predictedOutcome = getOutcome(predictedHome, predictedAway);
  const actualOutcome = getOutcome(actualHome, actualAway);

  // User predicted the draw (correct 90-min outcome) → 3 points
  if (predictedOutcome === actualOutcome && actualOutcome === "draw") {
    return 3;
  }

  // User predicted the correct advancing team → 1 point
  if (
    penaltyWinner &&
    predictedAdvancer &&
    predictedAdvancer === penaltyWinner
  ) {
    return 1;
  }

  return 0;
}
