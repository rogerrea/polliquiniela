export const stageLabels: Record<string, string> = {
  GROUP: "Fase de grupos",
  ROUND_OF_32: "Ronda de 32",
  ROUND_OF_16: "Octavos de final",
  QUARTER_FINAL: "Cuartos de final",
  SEMI_FINAL: "Semifinales",
  THIRD_PLACE: "Tercer lugar",
  FINAL: "Final"
};

export const knockoutStages = new Set([
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL"
]);

export function isKnockoutStage(stage: string) {
  return knockoutStages.has(stage);
}
