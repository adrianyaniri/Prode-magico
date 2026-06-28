import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { calculateScore, calculatePenaltyScore } from "@/lib/scoring";
import { normalizeTeamName, normalizeRoundName } from "@/lib/sync/teams-map";
import { calculateBestThirdsAndKnockouts } from "@/lib/sync/bracket-calculator";
import { recalculateGroupStandings } from "@/lib/standings";

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
  let apiInfo: any = null;
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
    apiInfo = {
      count: data.count ?? apiMatches.length,
      competition: data.competition?.name ?? data.competition?.code ?? null,
      season: data.filters?.season ?? null,
      firstMatch: apiMatches.length > 0 ? {
        id: apiMatches[0].id,
        home: apiMatches[0].homeTeam?.name ?? "?",
        away: apiMatches[0].awayTeam?.name ?? "?",
        stage: apiMatches[0].stage,
        group: apiMatches[0].group,
        status: apiMatches[0].status,
        date: apiMatches[0].utcDate,
      } : null,
    };
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch from football-data API" },
      { status: 502 },
    );
  }

  // 2. Try API standings (bracket calculator needs them)
  let standingsSynced = 0;
  let apiStandingsFailed = false;
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
    } else {
      apiStandingsFailed = true;
      errors.push(`Standings API error ${standingsRes.status}`);
    }
  } catch {
    apiStandingsFailed = true;
    errors.push("Failed to fetch standings from football API");
  }

  // 3. Fetch DB matches for matching
  const { data: dbMatches, error: dbError } = await admin
    .from("matches")
    .select("*");
  if (dbError)
    return NextResponse.json(
      { error: "Failed to fetch DB matches: " + dbError.message },
      { status: 500 },
    );

  const apiIdLookup = new Map<string, any>();
  const fallbackLookup = new Map<string, any>();
  for (const m of dbMatches ?? []) {
    if (m.api_id != null) {
      apiIdLookup.set(String(m.api_id), m);
    }
    // Key: round + group + home + away (unique per match)
    const key = `${m.round_name}|${m.group_name ?? ""}|${m.home_team}|${m.away_team}`;
    fallbackLookup.set(key, m);
  }

  function normalizeGroup(apiGroup: string | null): string {
    return (apiGroup ?? "").replace("GROUP_", "");
  }

  function findDbMatch(apiMatch: ApiMatch, roundName: string, homeTeam: string, awayTeam: string): any | undefined {
    // 1. By api_id
    const byId = apiIdLookup.get(String(apiMatch.id));
    if (byId) { matchStats.byApiId++; return byId; }
    // 2. By round + group + home + away
    const group = normalizeGroup(apiMatch.group);
    const primary = fallbackLookup.get(`${roundName}|${group}|${homeTeam}|${awayTeam}`);
    if (primary) { matchStats.byPrimary++; return primary; }
    // 3. Try swapped home/away (API may differ from DB)
    const rev = fallbackLookup.get(`${roundName}|${group}|${awayTeam}|${homeTeam}`);
    if (rev) { matchStats.byReverse++; return rev; }
    matchStats.notFound++;
    return undefined;
  }

  // 4. Process finished matches
  let matchStats = { total: 0, byApiId: 0, byPrimary: 0, byReverse: 0, notFound: 0, scoreChanged: 0, notFinished: 0 };
  for (const apiMatch of apiMatches) {
    matchStats.total++;
    const roundName = normalizeRoundName(apiMatch.stage);
    let apiHome = apiMatch.homeTeam?.name ?? "";
    let apiAway = apiMatch.awayTeam?.name ?? "";

    const isKnockout = roundName !== "Group Stage";
    const normalizedHome = apiHome
      ? normalizeTeamName(apiHome)
      : "TBD";
    const normalizedAway = apiAway
      ? normalizeTeamName(apiAway)
      : "TBD";

    const dbMatch = findDbMatch(apiMatch, roundName, normalizedHome, normalizedAway);
    if (!dbMatch) continue;

    // Link api_id on first match (seed data has no api_id)
    if (dbMatch.api_id == null) {
      await admin
        .from("matches")
        .update({ api_id: apiMatch.id })
        .eq("id", dbMatch.id);
      dbMatch.api_id = apiMatch.id;
    }

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
      if (scoreChanged) matchStats.scoreChanged++;
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

  // 5. Fallback: if API standings failed, calculate from match results
  if (apiStandingsFailed || standingsSynced === 0) {
    const groups = "ABCDEFGHIJKL";
    let totalFallback = 0;
    for (const g of groups) {
      try {
        const result = await recalculateGroupStandings(admin, g);
        if (result) totalFallback += result.length;
      } catch {
        errors.push(`Fallback standings group ${g}: failed`);
      }
    }
    standingsSynced = totalFallback;
    if (standingsSynced === 0) {
      errors.push("Fallback standings returned 0 rows — match results may not be synced yet");
    }
  }

  // 6. Calculate bracket (R32 pairings) from standings
  await calculateBestThirdsAndKnockouts(admin);

  // Debug: add sample DB keys for matching comparison
  if (apiInfo) {
    apiInfo.sampleDbKeys = [...(dbMatches ?? [])]
      .filter((m: any) => m.group_name === "A")
      .slice(0, 6)
      .map((m: any) => `${m.round_name}|${m.group_name}|${m.home_team}|${m.away_team}`);
    apiInfo.sampleApiKeys = apiMatches.slice(0, 6).map((m: any) => {
      const g = m.group ? m.group.replace("GROUP_", "") : "";
      return `${normalizeRoundName(m.stage)}|${g}|${normalizeTeamName(m.homeTeam?.name ?? "")}|${normalizeTeamName(m.awayTeam?.name ?? "")}`;
    });
    apiInfo.matchStats = matchStats;
  }

  return NextResponse.json({ synced, scored, standingsSynced, errors, apiInfo });
}
