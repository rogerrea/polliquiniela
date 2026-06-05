import { describe, expect, it } from "vitest";
import {
  calculateGroupPredictionPoints,
  calculatePredictionPoints
} from "@/lib/scoring";

describe("calculatePredictionPoints", () => {
  it("awards 5 points for an exact score", () => {
    const points = calculatePredictionPoints(
      { stage: "GROUP", homeScore: 2, awayScore: 1, winnerTeamId: null },
      { predictedHomeScore: 2, predictedAwayScore: 1 }
    );

    expect(points).toBe(5);
  });

  it("awards 3 points for the correct outcome only", () => {
    const points = calculatePredictionPoints(
      { stage: "GROUP", homeScore: 3, awayScore: 1, winnerTeamId: null },
      { predictedHomeScore: 1, predictedAwayScore: 0 }
    );

    expect(points).toBe(3);
  });

  it("awards 4 points for correct outcome and correct goal difference", () => {
    const points = calculatePredictionPoints(
      { stage: "GROUP", homeScore: 3, awayScore: 1, winnerTeamId: null },
      { predictedHomeScore: 2, predictedAwayScore: 0 }
    );

    expect(points).toBe(4);
  });

  it("awards 1 point for wrong outcome with one exact team goal", () => {
    const points = calculatePredictionPoints(
      { stage: "GROUP", homeScore: 2, awayScore: 1, winnerTeamId: null },
      { predictedHomeScore: 2, predictedAwayScore: 3 }
    );

    expect(points).toBe(1);
  });

  it("handles draw predictions", () => {
    const points = calculatePredictionPoints(
      { stage: "GROUP", homeScore: 1, awayScore: 1, winnerTeamId: null },
      { predictedHomeScore: 2, predictedAwayScore: 2 }
    );

    expect(points).toBe(4);
  });

  it("ensures at least 4 knockout points for the correct winner", () => {
    const points = calculatePredictionPoints(
      { stage: "FINAL", homeScore: 1, awayScore: 1, winnerTeamId: "home-team" },
      {
        predictedHomeScore: 0,
        predictedAwayScore: 1,
        predictedWinnerTeamId: "home-team"
      }
    );

    expect(points).toBe(4);
  });
});

describe("calculateGroupPredictionPoints", () => {
  it("awards 10 points for exact first and second place", () => {
    const points = calculateGroupPredictionPoints(
      { firstTeamId: "mex", secondTeamId: "kor" },
      { firstTeamId: "mex", secondTeamId: "kor" }
    );

    expect(points).toBe(10);
  });

  it("awards partial points when first and second are swapped", () => {
    const points = calculateGroupPredictionPoints(
      { firstTeamId: "mex", secondTeamId: "kor" },
      { firstTeamId: "kor", secondTeamId: "mex" }
    );

    expect(points).toBe(4);
  });

  it("returns 0 while the real group result is incomplete", () => {
    const points = calculateGroupPredictionPoints(
      { firstTeamId: "mex", secondTeamId: null },
      { firstTeamId: "mex", secondTeamId: "kor" }
    );

    expect(points).toBe(0);
  });
});
