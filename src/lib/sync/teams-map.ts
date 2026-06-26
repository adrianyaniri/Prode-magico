/**
 * Team name mapping between football-data.org API and DB names.
 */

const TEAM_NAME_MAP: Record<string, string> = {
  // Existing mappings
  Curaçao: "Curacao",
  "Cape Verde Islands": "Cape Verde",
  "Ivory Coast": "Cote d'Ivoire",
  // Accent normalization — API sometimes includes accents
  "Côte d'Ivoire": "Cote d'Ivoire",
  // Country naming differences
  "Czech Republic": "Czechia",
  "Korea Republic": "South Korea",
  USA: "United States",
  Turkey: "Turkiye",
  "Bosnia and Herzegovina": "Bosnia-Herzegovina",
  "DR Congo": "Congo DR",
  // Full name → abbreviated
  "The Gambia": "Gambia",
  "São Tomé e Príncipe": "Sao Tome e Principe",
  "São Tomé and Príncipe": "Sao Tome e Principe",
};

/**
 * Normalize an API team name to match the DB convention.
 * Returns the same name if no mapping exists.
 */
export function normalizeTeamName(apiName: string): string {
  return TEAM_NAME_MAP[apiName] ?? apiName;
}

/**
 * Normalize a football-data.org stage name to match the DB convention.
 * API sends: GROUP_STAGE | LAST_32 | LAST_16 | QUARTER_FINALS | SEMI_FINALS | THIRD_PLACE | FINAL
 */
export function normalizeRoundName(apiRound: string): string {
  switch (apiRound) {
    case "GROUP_STAGE":    return "Group Stage";
    case "LAST_32":        return "Round of 32";
    case "LAST_16":        return "Round of 16";
    case "QUARTER_FINALS": return "Quarter-finals";
    case "SEMI_FINALS":    return "Semi-finals";
    case "THIRD_PLACE":    return "Third Place";
    case "FINAL":          return "Final";
    // Legacy fallback for API-Football strings
    default:
      if (apiRound.startsWith("Group Stage"))           return "Group Stage";
      if (apiRound.includes("Round of 32"))             return "Round of 32";
      if (apiRound.includes("Round of 16") || apiRound.includes("8th Finals")) return "Round of 16";
      if (apiRound.includes("Quarter"))                 return "Quarter-finals";
      if (apiRound.includes("Semi"))                    return "Semi-finals";
      if (apiRound.includes("3rd Place"))               return "Third Place";
      if (apiRound.includes("Final"))                   return "Final";
      return "Group Stage"; // safe fallback instead of passing raw unknown string
  }
}
