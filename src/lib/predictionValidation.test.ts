import { describe, expect, it } from "vitest";
import { validatePredictionInput } from "@/lib/predictionValidation";

const openGroupMatch = {
  stage: "GROUP",
  startsAt: new Date("2026-06-20T18:00:00.000Z"),
  status: "SCHEDULED",
  homeTeamId: "home",
  awayTeamId: "away"
};

describe("validatePredictionInput", () => {
  it("rejects locked predictions", () => {
    const result = validatePredictionInput(
      openGroupMatch,
      { predictedHomeScore: 1, predictedAwayScore: 1 },
      new Date("2026-06-20T17:56:00.000Z")
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Este pronóstico ya está cerrado.");
  });

  it("rejects negative scores", () => {
    const result = validatePredictionInput(
      openGroupMatch,
      { predictedHomeScore: -1, predictedAwayScore: 1 },
      new Date("2026-06-20T17:00:00.000Z")
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Goles local no puede ser negativo.");
  });

  it("rejects scores above 20", () => {
    const result = validatePredictionInput(
      openGroupMatch,
      { predictedHomeScore: 21, predictedAwayScore: 1 },
      new Date("2026-06-20T17:00:00.000Z")
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Goles local no puede ser mayor a 20.");
  });

  it("rejects cancelled matches", () => {
    const result = validatePredictionInput(
      { ...openGroupMatch, status: "CANCELLED" },
      { predictedHomeScore: 1, predictedAwayScore: 1 },
      new Date("2026-06-20T17:00:00.000Z")
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("No puedes pronosticar un partido cancelado.");
  });

  it("requires a valid home or away winner for knockout matches", () => {
    const result = validatePredictionInput(
      { ...openGroupMatch, stage: "FINAL" },
      {
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedWinnerTeamId: "third-team"
      },
      new Date("2026-06-20T17:00:00.000Z")
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "En eliminatorias, el ganador debe ser el equipo local o visitante."
    );
  });
});
