import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { calculateScore, calculatePenaltyScore } from "@/lib/scoring";
import { normalizeTeamName, normalizeRoundName } from "@/lib/sync/teams-map";
import { calculateBestThirdsAndKnockouts } from "@/lib/sync/bracket-calculator";

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

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isCronAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCronAuthorized) {
    const supabase = await createClient();
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
    if (!roleData || roleData.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const errors: string[] = [];
  let synced = 0;
  let scored = 0;

  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token)
    return NextResponse.json(
      { error: "Missing FOOTBALL_DATA_TOKEN" },
      { status: 500 },
    );

  // 1. Fetch matches
  let apiMatches: ApiMatch[];
  try {
    const res = await fetch(
      `${FOOTBALL_DATA_API_URL}/competitions/WC/matches`,
      {
        headers: { "X-Auth-Token": token },
        next: { revalidate: 0 },
      },
    );
    if (!res.ok)
      return NextResponse.json(
        { error: `Football-data API error ${res.status}` },
        { status: 502 },
      );
    const data = await res.json();
    apiMatches = data.matches ?? [];
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch from football-data API" },
      { status: 502 },
    );
  }

  // 2. Fetch all DB matches
  const { data: dbMatches, error: dbError } = await admin
    .from("matches")
    .select("*");
  if (dbError)
    return NextResponse.json(
      { error: "Failed to fetch DB matches: " + dbError.message },
      { status: 500 },
    );

  const matchLookup = new Map<string, (typeof dbMatches)[0]>();
  for (const m of dbMatches ?? []) {
    matchLookup.set(m.api_id.toString(), m);
  }

  // 3a. Sync group standings and get best thirds
  let standingsSynced = 0;
  let currentStandings: any[] = [];
  try {
    const standingsRes = await fetch(
      `${FOOTBALL_DATA_API_URL}/competitions/WC/standings`,
      {
        headers: { "X-Auth-Token": token },
        next: { revalidate: 0 },
      },
    );
    if (standingsRes.ok) {
      const standingsData = await standingsRes.json();
      const standingsResponse =
        standingsData.standings?.filter((s: any) => s.type === "TOTAL") ?? [];

      for (const st of standingsResponse) {
        const groupLabel = st.group.replace("GROUP_", "");
        for (const entry of st.table) {
          const teamName = normalizeTeamName(entry.team.name);
          const standingObj = {
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
          };
          currentStandings.push(standingObj);

          const { error: upsertErr } = await admin
            .from("group_standings")
            .upsert(standingObj, { onConflict: "group_name, position" });
          if (upsertErr) {
            errors.push(
              `Failed to upsert standings ${groupLabel} pos ${entry.position}: ${upsertErr.message}`,
            );
          } else {
            standingsSynced++;
          }
        }
      }
    }
  } catch {
    errors.push("Failed to fetch standings from football API");
  }

  // Calculate Best Thirds for Knockouts (Optional fallback strategy)
  // const calculatedThirds = calculateBestThirdsAndKnockouts(currentStandings, dbMatches);

  // 3c. Process finished matches
  for (const apiMatch of apiMatches) {
    const roundName = normalizeRoundName(apiMatch.stage);
    let apiHome = apiMatch.homeTeam?.name ?? "";
    let apiAway = apiMatch.awayTeam?.name ?? "";

    const isKnockout = roundName !== "Group Stage";
    const dbMatch = matchLookup.get(apiMatch.id.toString());
    if (!dbMatch) continue;

    const normalizedHome = apiHome
      ? normalizeTeamName(apiHome)
      : "TBD";
    const normalizedAway = apiAway
      ? normalizeTeamName(apiAway)
      : "TBD";

    // Update team names if they differ from what's in DB
    const teamsChanged =
      isKnockout &&
      (dbMatch.home_team !== normalizedHome ||
       dbMatch.away_team !== normalizedAway);

    if (teamsChanged) {
      await admin
        .from("matches")
        .update({
          home_team: normalizedHome,
          away_team: normalizedAway,
        })
        .eq("id", dbMatch.id);
    }

    if (!["FINISHED"].includes(apiMatch.status)) continue;
    if (
      apiMatch.score?.fullTime?.home === null ||
      apiMatch.score?.fullTime?.away === null
    )
      continue;

    const apiHomeScore = apiMatch.score.fullTime.home;
    const apiAwayScore = apiMatch.score.fullTime.away;

    const hasPenalties =
      apiMatch.score?.penalties?.home != null &&
      apiMatch.score?.penalties?.away != null;
    let penaltyWinner: string | null = null;

    if (hasPenalties) {
      penaltyWinner =
        apiMatch.score.penalties!.home! > apiMatch.score.penalties!.away!
          ? normalizedHome
          : normalizedAway;
    } else if (apiHomeScore !== apiAwayScore && isKnockout) {
      penaltyWinner =
        apiHomeScore > apiAwayScore ? normalizedHome : normalizedAway;
    }

    const scoreChanged =
      dbMatch.home_score !== apiHomeScore ||
      dbMatch.away_score !== apiAwayScore;
    const pwChanged = dbMatch.penalty_winner !== penaltyWinner;

    if (scoreChanged || pwChanged) {
      const updateData: Record<string, unknown> = {};
      if (scoreChanged) {
        updateData.home_score = apiHomeScore;
        updateData.away_score = apiAwayScore;
      }
      if (pwChanged) updateData.penalty_winner = penaltyWinner;

      const { error: updateError } = await admin
        .from("matches")
        .update(updateData)
        .eq("id", dbMatch.id);
      if (updateError) {
        errors.push(
          `Failed to update match ${dbMatch.id}: ${updateError.message}`,
        );
        continue;
      }
      synced++;
    }

    if (scoreChanged) {
      const { data: predictions, error: predError } = await admin
        .from("predictions")
        .select("id, home_score, away_score")
        .eq("match_id", dbMatch.id)
        .is("points", null);

      if (predError) {
        errors.push(
          `Failed to fetch predictions for match ${dbMatch.id}: ${predError.message}`,
        );
        continue;
      }

      const isDraw = apiHomeScore === apiAwayScore;
      for (const pred of predictions ?? []) {
        let points: number;
        if (hasPenalties && isDraw && isKnockout) {
          let predictedAdvancer: string | null = null;
          if (pred.home_score > pred.away_score)
            predictedAdvancer = normalizedHome;
          else if (pred.away_score > pred.home_score)
            predictedAdvancer = normalizedAway;

          points = calculatePenaltyScore(
            pred.home_score,
            pred.away_score,
            apiHomeScore,
            apiAwayScore,
            penaltyWinner ?? "",
            predictedAdvancer ?? "",
          );
        } else {
          points = calculateScore(
            pred.home_score,
            pred.away_score,
            apiHomeScore,
            apiAwayScore,
            penaltyWinner,
            penaltyWinner && isDraw && isKnockout
              ? penaltyWinner === normalizedHome
                ? normalizedHome
                : normalizedAway
              : null,
          );
        }

        const { error: pointsError } = await admin
          .from("predictions")
          .update({ points })
          .eq("id", pred.id);
        if (pointsError)
          errors.push(
            `Failed to score prediction ${pred.id}: ${pointsError.message}`,
          );
        else scored++;
      }
    }
  }

  return NextResponse.json({ synced, scored, standingsSynced, errors });
}
