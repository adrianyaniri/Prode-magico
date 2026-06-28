export const ROUND_NAMES_ES: Record<string, string> = {
  "Group Stage": "Fase de Grupos",
  "Round of 32": "16vos de Final",
  "Round of 16": "Octavos de Final",
  "Quarter-finals": "Cuartos de Final",
  "Semi-finals": "Semifinales",
  "Third Place": "Tercer Puesto",
  "Final": "Final",
};

export function esRound(round: string): string {
  return ROUND_NAMES_ES[round] ?? round;
}
