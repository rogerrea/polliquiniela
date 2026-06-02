import { isKnockoutStage } from "@/lib/stage";

export type MatchForPredictionValidation = {
  stage: string;
  startsAt: Date;
  status: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
};

export type PredictionInput = {
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictedWinnerTeamId?: string | null;
};

export function isPredictionLocked(match: MatchForPredictionValidation, now = new Date()) {
  const lockTime = new Date(match.startsAt.getTime() - 5 * 60 * 1000);
  return now >= lockTime;
}

export function validatePredictionInput(
  match: MatchForPredictionValidation,
  input: PredictionInput,
  now = new Date()
) {
  const errors: string[] = [];

  for (const [label, score] of [
    ["Goles local", input.predictedHomeScore],
    ["Goles visitante", input.predictedAwayScore]
  ] as const) {
    if (!Number.isInteger(score)) {
      errors.push(`${label} debe ser un número entero.`);
    } else if (score < 0) {
      errors.push(`${label} no puede ser negativo.`);
    } else if (score > 20) {
      errors.push(`${label} no puede ser mayor a 20.`);
    }
  }

  if (match.status === "CANCELLED") {
    errors.push("No puedes pronosticar un partido cancelado.");
  }

  if (isPredictionLocked(match, now)) {
    errors.push("Este pronóstico ya está cerrado.");
  }

  if (isKnockoutStage(match.stage)) {
    const winnerId = input.predictedWinnerTeamId;
    const allowedWinner =
      winnerId && [match.homeTeamId, match.awayTeamId].includes(winnerId);

    if (!allowedWinner) {
      errors.push("En eliminatorias, el ganador debe ser el equipo local o visitante.");
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}
