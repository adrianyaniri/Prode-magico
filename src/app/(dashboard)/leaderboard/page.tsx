import { createClient } from "@/lib/supabase/server";
import LeaderboardTable from "@/components/LeaderboardTable";
import { getLeaderboardEntries } from "./actions";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const entries = await getLeaderboardEntries();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-white">Tabla de Posiciones</h1>
      <LeaderboardTable entries={entries} currentUserId={user!.id} />
    </div>
  );
}
