import { isKnockoutStage } from "@/lib/stage";

export type MatchOutcome = "HOME_WIN" | "AWAY_WIN" | "DRAW";

export type ScoreLine = {
  homeScore: number;
  awayScore: number;
};

export type MatchForScoring = {
  stage: string;
  homeScore: number | null;
  awayScore: number | null;
  winnerTeamId: string | null;
};

export type PredictionForScoring = {
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictedWinnerTeamId?: string | null;
};

export type GroupPickForScoring = {
  firstTeamId?: string | null;
  secondTeamId?: string | null;
};

export function getOutcome(score: ScoreLine): MatchOutcome {
  if (score.homeScore > score.awayScore) return "HOME_WIN";
  if (score.homeScore < score.awayScore) return "AWAY_WIN";
  return "DRAW";
}

export function getGoalDifference(score: ScoreLine) {
  return score.homeScore - score.awayScore;
}

export function calculateBaseScore(actual: ScoreLine, predicted: ScoreLine) {
  if (
    actual.homeScore === predicted.homeScore &&
    actual.awayScore === predicted.awayScore
  ) {
    return 5;
  }

  let points = 0;
  const actualOutcome = getOutcome(actual);
  const predictedOutcome = getOutcome(predicted);

  if (actualOutcome === predictedOutcome) {
    points =
      getGoalDifference(actual) === getGoalDifference(predicted) ? 4 : 3;
  }

  if (actual.homeScore === predicted.homeScore) points += 1;
  if (actual.awayScore === predicted.awayScore) points += 1;

  return Math.min(points, 5);
}

export function calculatePredictionPoints(
  match: MatchForScoring,
  prediction: PredictionForScoring
) {
  if (match.homeScore === null || match.awayScore === null) {
    return 0;
  }

  const basePoints = calculateBaseScore(
    { homeScore: match.homeScore, awayScore: match.awayScore },
    {
      homeScore: prediction.predictedHomeScore,
      awayScore: prediction.predictedAwayScore
    }
  );

  if (!isKnockoutStage(match.stage)) {
    return basePoints;
  }

  const winnerBonusPoints =
    match.winnerTeamId &&
    prediction.predictedWinnerTeamId === match.winnerTeamId
      ? Math.max(basePoints, 4)
      : basePoints;

  return Math.min(winnerBonusPoints, 6);
}

export function calculateGroupPredictionPoints(
  actual: GroupPickForScoring,
  prediction: GroupPickForScoring
) {
  if (
    !actual.firstTeamId ||
    !actual.secondTeamId ||
    !prediction.firstTeamId ||
    !prediction.secondTeamId
  ) {
    return 0;
  }

  let points = 0;

  if (prediction.firstTeamId === actual.firstTeamId) {
    points += 5;
  } else if (prediction.firstTeamId === actual.secondTeamId) {
    points += 2;
  }

  if (prediction.secondTeamId === actual.secondTeamId) {
    points += 5;
  } else if (prediction.secondTeamId === actual.firstTeamId) {
    points += 2;
  }

  return points;
}

export function isExactScore(
  match: MatchForScoring,
  prediction: PredictionForScoring
) {
  return (
    match.homeScore !== null &&
    match.awayScore !== null &&
    match.homeScore === prediction.predictedHomeScore &&
    match.awayScore === prediction.predictedAwayScore
  );
}

export function isCorrectResult(
  match: MatchForScoring,
  prediction: PredictionForScoring
) {
  if (match.homeScore === null || match.awayScore === null) return false;

  return (
    getOutcome({ homeScore: match.homeScore, awayScore: match.awayScore }) ===
    getOutcome({
      homeScore: prediction.predictedHomeScore,
      awayScore: prediction.predictedAwayScore
    })
  );
}
