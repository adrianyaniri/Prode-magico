import { TEAM_NAMES_ES } from "@/lib/sync/teams-es";

type Scorer = {
  player: {
    id: number;
    name: string;
  };
  team: {
    id: number;
    name: string;
    crest: string;
  };
  goals: number;
  assists: number | null;
  penalties: number | null;
};

export default async function TopScorersTable() {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    return <div className="p-4 text-sm text-red-500">Error: API token not configured</div>;
  }

  let scorers: Scorer[] = [];
  try {
    const res = await fetch("http://api.football-data.org/v4/competitions/WC/scorers", {
      headers: { "X-Auth-Token": token },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    if (res.ok) {
      const data = await res.json();
      scorers = data.scorers ?? [];
    }
  } catch (error) {
    console.error("Failed to fetch top scorers", error);
  }

  if (scorers.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-zinc-500">
        Aún no hay goles registrados en el torneo.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-zinc-300">
        <thead className="border-b border-zinc-800 bg-[#111118]/50 text-xs font-semibold uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Jugador</th>
            <th className="px-4 py-3 font-medium">Equipo</th>
            <th className="px-4 py-3 text-center font-medium">Goles</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50 bg-[#1a1a24]">
          {scorers.map((s, idx) => (
            <tr key={s.player.id} className="transition-colors hover:bg-zinc-800/20">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-500 w-4">{idx + 1}.</span>
                  <span className="font-medium text-white">{s.player.name}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {s.team.crest && (
                    <img src={s.team.crest} alt={s.team.name} className="h-5 w-5 object-contain" />
                  )}
                  <span className="truncate">{TEAM_NAMES_ES[s.team.name] ?? s.team.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 font-bold text-amber-500">
                  {s.goals}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
