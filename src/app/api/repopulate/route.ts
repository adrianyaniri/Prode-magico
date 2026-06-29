import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeTeamName, normalizeRoundName } from "@/lib/sync/teams-map";

const FOOTBALL_DATA_API_URL = "http://api.football-data.org/v4";

type ApiMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  homeTeam: { name: string; shortName: string };
  awayTeam: { name: string; shortName: string };
  score: {
    winner: string | null;
    duration: string;
    fullTime: { home: number | null; away: number | null };
    penalties?: { home: number | null; away: number | null };
  };
};

type ApiStandingEntry = {
  position: number;
  team: { name: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

async function fetchAllMatches(): Promise<ApiMatch[]> {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) throw new Error("Missing FOOTBALL_DATA_TOKEN");
  const res = await fetch(`${FOOTBALL_DATA_API_URL}/competitions/WC/matches`, {
    headers: { "X-Auth-Token": token },
    cache: "no-store",
  });
  if (!res.ok)
    throw new Error(`Football-data Matches API error: ${res.status}`);
  const data = await res.json();
  return data.matches ?? [];
}

async function fetchStandings(): Promise<
  { group: string; table: ApiStandingEntry[] }[]
> {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) throw new Error("Missing FOOTBALL_DATA_TOKEN");
  const res = await fetch(
    `${FOOTBALL_DATA_API_URL}/competitions/WC/standings`,
    {
      headers: { "X-Auth-Token": token },
      cache: "no-store",
    },
  );
  if (!res.ok)
    throw new Error(`Football-data Standings API error: ${res.status}`);
  const data = await res.json();
  return data.standings?.filter((s: any) => s.type === "TOTAL") ?? [];
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isCronAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;

  let isAdmin = false;
  const supabase = await createClient();
  const adminClient = createAdminClient();

  if (!isCronAuthorized) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    if (roleData?.role === "admin") isAdmin = true;
    if (!isAdmin)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const apiMatches = await fetchAllMatches();
    const standingsData = await fetchStandings();

    const dbMatches: Record<string, unknown>[] = [];

    // Process Matches
    for (const m of apiMatches) {
      const roundName = normalizeRoundName(m.stage);
      // Save TBD if team not yet determined — the front-end converts TBD → "?"
      const homeTeam = m.homeTeam?.name ? normalizeTeamName(m.homeTeam.name) : "TBD";
      const awayTeam = m.awayTeam?.name ? normalizeTeamName(m.awayTeam.name) : "TBD";

      const homeScore = m.score?.fullTime?.home ?? null;
      const awayScore = m.score?.fullTime?.away ?? null;
      const groupName = m.group ? m.group.replace("GROUP_", "") : null;

      let penaltyWinner: string | null = null;
      if (m.score?.penalties?.home != null && m.score?.penalties?.away != null) {
        penaltyWinner =
          m.score.penalties.home > m.score.penalties.away ? homeTeam : awayTeam;
      } else if (
        ["FINISHED", "IN_PLAY", "PAUSED"].includes(m.status) &&
        homeScore !== null &&
        awayScore !== null &&
        homeScore !== awayScore &&
        roundName !== "Group Stage"
      ) {
        penaltyWinner = homeScore > awayScore ? homeTeam : awayTeam;
      }

      dbMatches.push({
        api_id: m.id,
        home_team: homeTeam,
        away_team: awayTeam,
        home_score: homeScore,
        away_score: awayScore,
        round_name: roundName,
        group_name: groupName,
        kickoff_at: m.utcDate,
        penalty_winner: penaltyWinner,
      });
    }

    // We no longer wipe matches with delete() because it triggers ON DELETE CASCADE 
    // on the predictions table, deleting all user predictions.
    // Instead, we just upsert to update teams/scores natively without deleting the UUIDs.
    const { error: matchesError } = await adminClient.from("matches").upsert(dbMatches, { onConflict: "api_id", ignoreDuplicates: false });
    if (matchesError) throw matchesError;

    // Process Standings
    for (const st of standingsData) {
      const groupLabel = st.group.replace("GROUP_", "");
      for (const entry of st.table) {
        const teamName = normalizeTeamName(entry.team.name);
        const { error: upsertErr } = await adminClient.from("group_standings").upsert(
          {
            group_name: groupLabel,
            position: entry.position,
            team: teamName,
            played: entry.playedGames,
            won: entry.won,
            draw: entry.draw,
            lost: entry.lost,
            goals_for: entry.goalsFor,
            goals_against: entry.goalsAgainst,
            goal_difference: entry.goalDifference,
            points: entry.points,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "group_name, position" },
        );
        if (upsertErr) throw upsertErr;
      }
    }

    return NextResponse.json({ 
      success: true, 
      matchesInserted: dbMatches.length,
      standingsSaved: standingsData.reduce((sum, st) => sum + st.table.length, 0),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
