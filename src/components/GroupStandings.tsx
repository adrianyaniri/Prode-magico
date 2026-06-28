"use client";

import { TEAM_NAMES_ES } from "@/lib/sync/teams-es";
import { TEAM_CRESTS } from "@/lib/sync/teams-crests";

type Standing = {
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

const GROUP_LABELS = [
  "A", "B", "C", "D", "E", "F",
  "G", "H", "I", "J", "K", "L",
];

function es(team: string): string {
  return TEAM_NAMES_ES[team] ?? team;
}

function getRowStyle(position: number, groupSize: number): string {
  if (position <= 2) {
    return "bg-green-900/15 border-l-2 border-green-500";
  }
  if (position === 3 && groupSize === 4) {
    return "bg-yellow-900/10 border-l-2 border-yellow-500";
  }
  return "opacity-40 border-l-2 border-zinc-700";
}

export default function GroupStandings({
  standings,
}: {
  standings: Standing[];
}) {
  if (standings.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-[#1a1a24] p-6 text-center text-sm text-zinc-500">
        Tabla de posiciones no disponible
      </div>
    );
  }

  const groupSize = standings.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 text-left">#</th>
            <th className="px-3 py-2 text-left">Equipo</th>
            <th className="px-3 py-2 text-center">PJ</th>
            <th className="px-3 py-2 text-center">DG</th>
            <th className="px-3 py-2 text-center font-bold text-white">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s) => (
            <tr
              key={`${s.team}-${s.position}`}
              className={`border-b border-zinc-800/30 transition-colors hover:bg-zinc-800/20 ${getRowStyle(s.position, groupSize)}`}
            >
              <td className="px-3 py-2 font-medium text-zinc-300">
                {s.position}
              </td>
              <td className="px-3 py-2 font-medium text-white whitespace-nowrap flex items-center gap-1.5">
                {TEAM_CRESTS[s.team] && (
                  <img src={TEAM_CRESTS[s.team]} alt={s.team} className="h-4 w-4 object-contain" />
                )}
                {es(s.team)}
              </td>
              <td className="px-3 py-2 text-center text-zinc-400">{s.played}</td>
              <td
                className={`px-3 py-2 text-center font-medium ${
                  s.goal_difference > 0
                    ? "text-green-400"
                    : s.goal_difference < 0
                      ? "text-red-400"
                      : "text-zinc-400"
                }`}
              >
                {s.goal_difference > 0
                  ? `+${s.goal_difference}`
                  : s.goal_difference}
              </td>
              <td className="px-3 py-2 text-center font-bold text-white">
                {s.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { getGroupStandings } from "@/app/(dashboard)/matches/actions";

export function GroupStandingsGrid({
  standingsByGroup: initialData,
}: {
  standingsByGroup: Record<string, Standing[]>;
}) {
  const { data: standingsByGroup = {} } = useQuery({
    queryKey: ["group_standings"],
    queryFn: async () => await getGroupStandings(),
    initialData,
  });

  const labels = GROUP_LABELS.filter((l) => standingsByGroup[l]?.length > 0);

  if (labels.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-[#1a1a24] p-6 text-center text-sm text-zinc-500">
        Tabla de posiciones no disponible
      </div>
    );
  }

  return (
    <div>
      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-1 rounded-full bg-green-500" />
          Clasifica
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-1 rounded-full bg-yellow-500" />
          Posible 3°
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-1 rounded-full bg-zinc-700" />
          Eliminado
        </span>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {labels.map((label) => (
          <section key={label}>
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#1a1a24]">
              <div className="border-b border-zinc-800 px-4 py-2.5">
                <h3 className="text-sm font-bold text-white">
                  Grupo {label}
                </h3>
              </div>
              <div className="p-2">
                <GroupStandings standings={standingsByGroup[label]} />
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
