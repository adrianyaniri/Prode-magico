import { SupabaseClient } from "@supabase/supabase-js";

type Standing = {
  group_name: string;
  position: number;
  team: string;
  played: number;
  points?: number;
  goal_difference?: number;
  goals_for?: number;
  won?: number;
};

function getTeam(
  standings: Standing[],
  group: string,
  pos: number,
): string | null {
  const entry = standings.find(
    (s) => s.group_name === group && s.position === pos,
  );
  if (
    entry &&
    entry.played >= 3 &&
    entry.team &&
    !entry.team.startsWith("TBD") &&
    !entry.team.startsWith("?")
  ) {
    return entry.team;
  }
  return null;
}

/**
 * Get the N-th best third-placed team (0-indexed).
 * FIFA tiebreakers: points > GD > GF > wins.
 */
function getBestThird(standings: Standing[], index: number): string | null {
  const thirds = standings
    .filter((s) => s.position === 3 && s.played >= 3)
    .sort((a, b) => {
      if ((b.points ?? 0) !== (a.points ?? 0))
        return (b.points ?? 0) - (a.points ?? 0);
      if ((b.goal_difference ?? 0) !== (a.goal_difference ?? 0))
        return (b.goal_difference ?? 0) - (a.goal_difference ?? 0);
      if ((b.goals_for ?? 0) !== (a.goals_for ?? 0))
        return (b.goals_for ?? 0) - (a.goals_for ?? 0);
      return (b.won ?? 0) - (a.won ?? 0);
    });

  return thirds[index]?.team ?? null;
}

/**
 * FIFA 2026 Round of 32 — Partidos 73 to 88.
 * Order matches the official FIFA schedule (chronological by date).
 *
 * 73: 2A vs 2B           (runner-up vs runner-up)
 * 74: 1E vs 3°A/B/C/D/F   (winner vs third)
 * 75: 1F vs 2C           (winner vs runner-up)
 * 76: 1C vs 2F           (winner vs runner-up)
 * 77: 1I vs 3°C/D/F/G/H   (winner vs third)
 * 78: 2E vs 2I           (runner-up vs runner-up)
 * 79: 1A vs 3°C/E/F/H/I   (winner vs third)
 * 80: 1L vs 3°E/H/I/J/K   (winner vs third)
 * 81: 1D vs 3°B/E/F/I/J   (winner vs third)
 * 82: 1G vs 3°A/E/H/I/J   (winner vs third)
 * 83: 2K vs 2L           (runner-up vs runner-up)
 * 84: 1H vs 2J           (winner vs runner-up)
 * 85: 1B vs 3°E/F/G/I/J   (winner vs third)
 * 86: 1J vs 2H           (winner vs runner-up)
 * 87: 1K vs 3°D/E/I/J/L   (winner vs third)
 * 88: 2D vs 2G           (runner-up vs runner-up)
 */
const R32_PAIRS: { home: (s: Standing[]) => string | null; away: (s: Standing[]) => string | null }[] = [
  // 73 — 2A vs 2B
  { home: (s) => getTeam(s, "A", 2), away: (s) => getTeam(s, "B", 2) },
  // 74 — 1E vs 3°(0)
  { home: (s) => getTeam(s, "E", 1), away: (s) => getBestThird(s, 0) },
  // 75 — 1F vs 2C
  { home: (s) => getTeam(s, "F", 1), away: (s) => getTeam(s, "C", 2) },
  // 76 — 1C vs 2F
  { home: (s) => getTeam(s, "C", 1), away: (s) => getTeam(s, "F", 2) },
  // 77 — 1I vs 3°(1)
  { home: (s) => getTeam(s, "I", 1), away: (s) => getBestThird(s, 1) },
  // 78 — 2E vs 2I
  { home: (s) => getTeam(s, "E", 2), away: (s) => getTeam(s, "I", 2) },
  // 79 — 1A vs 3°(2)
  { home: (s) => getTeam(s, "A", 1), away: (s) => getBestThird(s, 2) },
  // 80 — 1L vs 3°(3)
  { home: (s) => getTeam(s, "L", 1), away: (s) => getBestThird(s, 3) },
  // 81 — 1D vs 3°(4)
  { home: (s) => getTeam(s, "D", 1), away: (s) => getBestThird(s, 4) },
  // 82 — 1G vs 3°(5)
  { home: (s) => getTeam(s, "G", 1), away: (s) => getBestThird(s, 5) },
  // 83 — 2K vs 2L
  { home: (s) => getTeam(s, "K", 2), away: (s) => getTeam(s, "L", 2) },
  // 84 — 1H vs 2J
  { home: (s) => getTeam(s, "H", 1), away: (s) => getTeam(s, "J", 2) },
  // 85 — 1B vs 3°(6)
  { home: (s) => getTeam(s, "B", 1), away: (s) => getBestThird(s, 6) },
  // 86 — 1J vs 2H
  { home: (s) => getTeam(s, "J", 1), away: (s) => getTeam(s, "H", 2) },
  // 87 — 1K vs 3°(7)
  { home: (s) => getTeam(s, "K", 1), away: (s) => getBestThird(s, 7) },
  // 88 — 2D vs 2G
  { home: (s) => getTeam(s, "D", 2), away: (s) => getTeam(s, "G", 2) },
];

const PLACEHOLDER_RE = /^[0-9A-Z/]+$/;

function isPlaceholder(name: string): boolean {
  return (
    PLACEHOLDER_RE.test(name) ||
    name.startsWith("W") ||
    name.startsWith("LS") ||
    name === "TBD" ||
    name === "?"
  );
}

export async function calculateBestThirdsAndKnockouts(
  supabase: SupabaseClient,
): Promise<number> {
  const { data: standings, error: standingsError } = await supabase
    .from("group_standings")
    .select("*");

  if (standingsError || !standings) {
    console.error("Error fetching standings for bracket calculation");
    return 0;
  }

  const all = standings as Standing[];
  const groupsDone = [..."ABCDEFGHIJKL"].every(
    (g) => all.filter((s) => s.group_name === g && s.played >= 3).length >= 3,
  );
  if (!groupsDone) return 0;

  // Fetch R32 matches ordered by kickoff_at (must match FIFA chronological order)
  const { data: ro32, error: matchError } = await supabase
    .from("matches")
    .select("id, home_team, away_team")
    .eq("round_name", "Round of 32")
    .order("kickoff_at", { ascending: true });

  if (matchError || !ro32 || ro32.length < 16) {
    console.error("Not enough R32 matches found");
    return 0;
  }

  let updates = 0;

  for (let i = 0; i < 16; i++) {
    const dbMatch = ro32[i];
    const pair = R32_PAIRS[i];

    const homeTeam = pair.home(all);
    const awayTeam = pair.away(all);
    if (!homeTeam || !awayTeam) continue;

    if (
      isPlaceholder(dbMatch.home_team) ||
      isPlaceholder(dbMatch.away_team) ||
      dbMatch.home_team !== homeTeam ||
      dbMatch.away_team !== awayTeam
    ) {
      const { error: err } = await supabase
        .from("matches")
        .update({ home_team: homeTeam, away_team: awayTeam })
        .eq("id", dbMatch.id);
      if (!err) updates++;
    }
  }

  return updates;
}
