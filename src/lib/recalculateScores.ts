import { prisma } from "@/lib/prisma";
import {
  calculateGroupPredictionPoints,
  calculatePredictionPoints
} from "@/lib/scoring";

export async function recalculateScores() {
  const finishedMatches = await prisma.match.findMany({
    where: { status: "FINISHED" },
    include: {
      predictions: true
    }
  });

  let updatedPredictions = 0;

  for (const match of finishedMatches) {
    for (const prediction of match.predictions) {
      const points = calculatePredictionPoints(match, prediction);
      await prisma.prediction.update({
        where: { id: prediction.id },
        data: { points }
      });
      updatedPredictions += 1;
    }
  }

  const actual = await prisma.tournamentActual.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" }
  });

  const tournamentPredictions = await prisma.tournamentPrediction.findMany();
  let updatedTournamentPredictions = 0;

  for (const prediction of tournamentPredictions) {
    let points = 0;
    if (
      actual.championTeamId &&
      prediction.championTeamId === actual.championTeamId
    ) {
      points += 20;
    }
    if (
      actual.runnerUpTeamId &&
      prediction.runnerUpTeamId === actual.runnerUpTeamId
    ) {
      points += 12;
    }
    await prisma.tournamentPrediction.update({
      where: { id: prediction.id },
      data: { points }
    });
    updatedTournamentPredictions += 1;
  }

  const groupActuals = await prisma.groupActual.findMany();
  const actualByGroup = new Map(
    groupActuals.map((groupActual) => [groupActual.groupLetter, groupActual])
  );
  const groupPredictions = await prisma.groupPrediction.findMany();
  let updatedGroupPredictions = 0;

  for (const prediction of groupPredictions) {
    const actualGroup = actualByGroup.get(prediction.groupLetter);
    const points = actualGroup
      ? calculateGroupPredictionPoints(actualGroup, prediction)
      : 0;

    await prisma.groupPrediction.update({
      where: { id: prediction.id },
      data: { points }
    });
    updatedGroupPredictions += 1;
  }

  return {
    updatedPredictions,
    updatedTournamentPredictions,
    updatedGroupPredictions
  };
}
