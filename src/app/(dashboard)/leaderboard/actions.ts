"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type LeaderboardEntry = {
  rank: number;
  user_id: string;
  username: string;
  total_points: number;
  exact_scores: number;
  correct_results: number;
  created_at: string;
};

export async function getLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  const { data: scores } = await supabase
    .from("predictions")
    .select("user_id, points, match_id");

  const { data: bonusScores } = await supabase
    .from("bonus_predictions")
    .select("user_id, points");

  const { data: users } = await supabase
    .from("user_roles")
    .select("user_id, role, created_at");

  const adminSupabase = createAdminClient();
  const { data: authUsers } = await adminSupabase.auth.admin.listUsers();
  const userEmailMap = new Map(
    authUsers?.users?.map((u) => [
      u.id, 
      u.user_metadata?.username || (u.email ? u.email.split('@')[0] : u.id)
    ]) ?? [],
  );

  const userScores = new Map<
    string,
    { total: number; exact: number; result: number; created_at: string }
  >();

  for (const u of users ?? []) {
    if (u.role === "admin") continue;
    userScores.set(u.user_id, {
      total: 0,
      exact: 0,
      result: 0,
      created_at: u.created_at,
    });
  }

  for (const s of scores ?? []) {
    if (s.points === null) continue;
    const entry = userScores.get(s.user_id);
    if (entry) {
      entry.total += s.points;
      if (s.points === 5) entry.exact += 1;
      else if (s.points === 3) entry.result += 1;
    }
  }

  for (const b of bonusScores ?? []) {
    if (b.points === null) continue;
    const entry = userScores.get(b.user_id);
    if (entry) {
      entry.total += b.points;
    }
  }

  const sorted = Array.from(userScores.entries())
    .map(([userId, data]) => ({
      user_id: userId,
      username: userEmailMap.get(userId) ?? "Unknown",
      total_points: data.total,
      exact_scores: data.exact,
      correct_results: data.result,
      created_at: data.created_at,
    }))
    .sort((a, b) => {
      if (b.total_points !== a.total_points)
        return b.total_points - a.total_points;
      if (b.exact_scores !== a.exact_scores)
        return b.exact_scores - a.exact_scores;
      if (b.correct_results !== a.correct_results)
        return b.correct_results - a.correct_results;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  return sorted.reduce(
    (acc, entry, i) => {
      if (i === 0) return [{ ...entry, rank: 1 }];
      const prev = sorted[i - 1];
      const isTied =
        entry.total_points === prev.total_points &&
        entry.exact_scores === prev.exact_scores &&
        entry.correct_results === prev.correct_results &&
        new Date(entry.created_at).getTime() ===
          new Date(prev.created_at).getTime();
      return [
        ...acc,
        { ...entry, rank: isTied ? acc[acc.length - 1].rank : i + 1 },
      ];
    },
    [] as LeaderboardEntry[],
  );
}
