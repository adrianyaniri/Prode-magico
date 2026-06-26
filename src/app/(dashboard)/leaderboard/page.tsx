import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import LeaderboardTable from "@/components/LeaderboardTable";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all predictions with their points and join with user_roles for email
  // We compute leaderboard from predictions points
  const { data: scores } = await supabase
    .from("predictions")
    .select("user_id, points, match_id");

  // Fetch bonus predictions points
  const { data: bonusScores } = await supabase
    .from("bonus_predictions")
    .select("user_id, points");

  // Get all users with their roles
  const { data: users } = await supabase
    .from("user_roles")
    .select("user_id, role, created_at");

  // Get user emails from auth — we use a workaround since auth.users isn't directly
  // accessible. We'll use the predictions data which is available.
  // For emails, we query auth.users via the Supabase API
  const adminSupabase = createAdminClient();
  const { data: authUsers } = await adminSupabase.auth.admin.listUsers();
  const userEmailMap = new Map(
    authUsers?.users?.map((u) => [
      u.id, 
      u.user_metadata?.username || (u.email ? u.email.split('@')[0] : u.id)
    ]) ?? [],
  );

  // Build leaderboard entries
  const userScores = new Map<
    string,
    { total: number; exact: number; result: number; created_at: string }
  >();

  // Initialize all users with 0 scores (excluding admins)
  for (const u of users ?? []) {
    if (u.role === "admin") continue;
    
    userScores.set(u.user_id, {
      total: 0,
      exact: 0,
      result: 0,
      created_at: u.created_at,
    });
  }

  // Aggregate scores
  for (const s of scores ?? []) {
    if (s.points === null) continue;
    const entry = userScores.get(s.user_id);
    if (entry) {
      entry.total += s.points;
      if (s.points === 5) entry.exact += 1;
      else if (s.points === 3) entry.result += 1;
    }
  }

  // Aggregate bonus scores
  for (const b of bonusScores ?? []) {
    if (b.points === null) continue;
    const entry = userScores.get(b.user_id);
    if (entry) {
      entry.total += b.points;
    }
  }

  // Convert to array and sort
  type LeaderboardEntry = {
    user_id: string;
    username: string;
    total_points: number;
    exact_scores: number;
    correct_results: number;
    created_at: string;
  };

  const sorted: LeaderboardEntry[] = Array.from(userScores.entries())
    .map(([userId, data]) => ({
      user_id: userId,
      username: userEmailMap.get(userId) ?? "Unknown",
      total_points: data.total,
      exact_scores: data.exact,
      correct_results: data.result,
      created_at: data.created_at,
    }))
    .sort((a, b) => {
      // Sort by total_points desc, then exact_scores desc, then correct_results desc, then created_at asc
      if (b.total_points !== a.total_points)
        return b.total_points - a.total_points;
      if (b.exact_scores !== a.exact_scores)
        return b.exact_scores - a.exact_scores;
      if (b.correct_results !== a.correct_results)
        return b.correct_results - a.correct_results;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  const entries: Array<LeaderboardEntry & { rank: number }> = sorted.reduce(
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
    [] as Array<LeaderboardEntry & { rank: number }>,
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-white">Tabla de Posiciones</h1>
      <LeaderboardTable entries={entries} currentUserId={user!.id} />
    </div>
  );
}
