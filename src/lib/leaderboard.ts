import { prisma } from "@/lib/prisma";
import { isCorrectResult, isExactScore } from "@/lib/scoring";
import { isKnockoutStage } from "@/lib/stage";

export type LeaderboardRow = {
  rank: number;
  userId: string;
  name: string;
  totalPoints: number;
  groupPredictionPoints: number;
  matchPredictionPoints: number;
  tournamentPredictionPoints: number;
  exactScoresCount: number;
  correctResultsCount: number;
  knockoutPoints: number;
  createdAt: Date;
};

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const users = await prisma.user.findMany({
    include: {
      predictions: {
        include: {
          match: true
        }
      },
      groupPredictions: true,
      tournamentPrediction: true
    }
  });

  const rows = users.map((user) => {
    const finishedPredictions = user.predictions.filter(
      (prediction) => prediction.match.status === "FINISHED"
    );
    const matchPredictionPoints = finishedPredictions.reduce(
      (total, prediction) => total + prediction.points,
      0
    );
    const tournamentPredictionPoints = user.tournamentPrediction?.points ?? 0;
    const groupPredictionPoints = user.groupPredictions.reduce(
      (total, prediction) => total + prediction.points,
      0
    );
    const exactScoresCount = finishedPredictions.filter((prediction) =>
      isExactScore(prediction.match, prediction)
    ).length;
    const correctResultsCount = finishedPredictions.filter((prediction) =>
      isCorrectResult(prediction.match, prediction)
    ).length;
    const knockoutPoints = finishedPredictions
      .filter((prediction) => isKnockoutStage(prediction.match.stage))
      .reduce((total, prediction) => total + prediction.points, 0);

    return {
      rank: 0,
      userId: user.id,
      name: user.name,
      totalPoints:
        groupPredictionPoints +
        matchPredictionPoints +
        tournamentPredictionPoints,
      groupPredictionPoints,
      matchPredictionPoints,
      tournamentPredictionPoints,
      exactScoresCount,
      correctResultsCount,
      knockoutPoints,
      createdAt: user.createdAt
    };
  });

  rows.sort((a, b) => {
    return (
      b.totalPoints - a.totalPoints ||
      b.exactScoresCount - a.exactScoresCount ||
      b.correctResultsCount - a.correctResultsCount ||
      b.knockoutPoints - a.knockoutPoints ||
      a.createdAt.getTime() - b.createdAt.getTime()
    );
  });

  return rows.map((row, index) => ({
    ...row,
    rank: index + 1
  }));
}
