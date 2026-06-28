import { SupabaseClient } from "@supabase/supabase-js";

export type Match = {
  id: number;
  api_id: number;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  round_name: string;
  group_name: string | null;
  kickoff_at: string;
  penalty_winner: string | null;
};

export type Standing = {
  group_name: string;
  position: number;
  team: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
};

export async function recalculateGroupStandings(
  supabase: SupabaseClient,
  groupName: string
) {
  // Fetch all matches for this group
  const { data: matches, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("group_name", groupName);

  if (matchError || !matches) {
    console.error(`Failed to fetch matches for group ${groupName}:`, matchError);
    return;
  }

  const teamStats = new Map<string, Standing>();

  const getStats = (teamName: string): Standing => {
    if (!teamStats.has(teamName)) {
      teamStats.set(teamName, {
        group_name: groupName,
        position: 0, // Set later
        team: teamName,
        played: 0,
        won: 0,
        draw: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0,
      });
    }
    return teamStats.get(teamName)!;
  };

  for (const match of matches as Match[]) {
    if (match.home_team !== "TBD" && match.home_team !== "?") {
        getStats(match.home_team);
    }
    if (match.away_team !== "TBD" && match.away_team !== "?") {
        getStats(match.away_team);
    }

    if (match.home_score !== null && match.away_score !== null && match.home_team !== "TBD" && match.away_team !== "TBD") {
      const home = getStats(match.home_team);
      const away = getStats(match.away_team);

      home.played++;
      away.played++;
      home.goals_for += match.home_score;
      home.goals_against += match.away_score;
      away.goals_for += match.away_score;
      away.goals_against += match.home_score;

      if (match.home_score > match.away_score) {
        home.won++;
        away.lost++;
        home.points += 3;
      } else if (match.home_score < match.away_score) {
        away.won++;
        home.lost++;
        away.points += 3;
      } else {
        home.draw++;
        away.draw++;
        home.points += 1;
        away.points += 1;
      }
    }
  }

  for (const stats of teamStats.values()) {
    stats.goal_difference = stats.goals_for - stats.goals_against;
  }

  const standings = Array.from(teamStats.values());

  // Sort: Points > GD > GF > Wins > Random/Alphabetical
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    if (b.won !== a.won) return b.won - a.won;
    return a.team.localeCompare(b.team);
  });

  // Assign positions
  standings.forEach((s, idx) => {
    s.position = idx + 1;
  });

  // Upsert into DB
  for (const st of standings) {
    const { error: upsertErr } = await supabase
      .from("group_standings")
      .upsert(
        {
          group_name: st.group_name,
          position: st.position,
          team: st.team,
          played: st.played,
          won: st.won,
          draw: st.draw,
          lost: st.lost,
          goals_for: st.goals_for,
          goals_against: st.goals_against,
          goal_difference: st.goal_difference,
          points: st.points,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "group_name, position" }
      );
    if (upsertErr) {
      console.error(`Error upserting standings for ${st.team}:`, upsertErr);
    }
  }

  return standings;
}
