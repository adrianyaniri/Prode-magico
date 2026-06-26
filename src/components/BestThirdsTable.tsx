import { createClient } from "@/lib/supabase/server";
import { TEAM_NAMES_ES } from "@/lib/sync/teams-es";
import { TEAM_CRESTS } from "@/lib/sync/teams-crests";

type StandingRow = {
  id: number;
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

export default async function BestThirdsTable() {
  const supabase = await createClient();

  // Fetch all 3rd place teams
  const { data: thirds } = await supabase
    .from("group_standings")
    .select("*")
    .eq("position", 3)
    .order("points", { ascending: false })
    .order("goal_difference", { ascending: false })
    .order("goals_for", { ascending: false });

  const teams = (thirds ?? []) as StandingRow[];

  if (teams.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-zinc-500">
        Las posiciones aún no están disponibles.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-zinc-300">
        <thead className="border-b border-zinc-800 bg-[#111118]/50 text-xs font-semibold uppercase text-zinc-500">
          <tr>
            <th className="px-3 py-3 font-medium">Pos</th>
            <th className="px-3 py-3 font-medium">Equipo</th>
            <th className="px-3 py-3 font-medium text-center">Pts</th>
            <th className="px-3 py-3 font-medium text-center">PJ</th>
            <th className="px-3 py-3 font-medium text-center">G</th>
            <th className="px-3 py-3 font-medium text-center">E</th>
            <th className="px-3 py-3 font-medium text-center">P</th>
            <th className="px-3 py-3 font-medium text-center">GF</th>
            <th className="px-3 py-3 font-medium text-center">GC</th>
            <th className="px-3 py-3 font-medium text-center">DG</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50 bg-[#1a1a24]">
          {teams.map((t, idx) => {
            const isQualified = idx < 8;
            return (
              <tr
                key={t.id}
                className={`transition-colors hover:bg-zinc-800/20 ${
                  !isQualified ? "opacity-50" : ""
                }`}
              >
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-sm text-[10px] font-bold ${
                        isQualified
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    {TEAM_CRESTS[t.team] && (
                      <img src={TEAM_CRESTS[t.team]} alt={t.team} className="h-5 w-5 object-contain" />
                    )}
                    <span className="font-medium text-white truncate max-w-[120px]">
                      {TEAM_NAMES_ES[t.team] ?? t.team}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono bg-zinc-800 px-1 rounded">
                      Gr.{t.group_name}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center font-bold text-white">{t.points}</td>
                <td className="px-3 py-3 text-center text-zinc-400">{t.played}</td>
                <td className="px-3 py-3 text-center text-zinc-400">{t.won}</td>
                <td className="px-3 py-3 text-center text-zinc-400">{t.draw}</td>
                <td className="px-3 py-3 text-center text-zinc-400">{t.lost}</td>
                <td className="px-3 py-3 text-center text-zinc-400">{t.goals_for}</td>
                <td className="px-3 py-3 text-center text-zinc-400">{t.goals_against}</td>
                <td className="px-3 py-3 text-center text-zinc-400 font-mono">
                  {t.goal_difference > 0 ? `+${t.goal_difference}` : t.goal_difference}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {teams.length > 8 && (
        <div className="bg-[#1a1a24] p-3 text-xs text-zinc-500 border-t border-zinc-800/50 flex justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Clasifican a 16vos
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Eliminados
          </div>
        </div>
      )}
    </div>
  );
}
