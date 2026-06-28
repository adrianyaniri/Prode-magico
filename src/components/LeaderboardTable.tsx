"use client";

import { useQuery } from "@tanstack/react-query";
import { getLeaderboardEntries, type LeaderboardEntry } from "@/app/(dashboard)/leaderboard/actions";

export default function LeaderboardTable({
  entries: initialData,
  currentUserId,
}: {
  entries: LeaderboardEntry[];
  currentUserId: string;
}) {
  const { data: entries = [] } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => await getLeaderboardEntries(),
    initialData,
  });

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <p className="text-zinc-400">No hay participantes aún.</p>
        <p className="text-xs text-zinc-600">
          Los puntajes aparecerán cuando se carguen los resultados.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50">
            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              #
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Jugador
            </th>
            <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
              Pts
            </th>
            <th className="hidden px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 sm:table-cell">
              Exacto
            </th>
            <th className="hidden px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 sm:table-cell">
              Resultado
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {entries.map((entry) => {
            const isMe = entry.user_id === currentUserId;
            return (
              <tr
                key={entry.user_id}
                className={`transition-colors ${
                  isMe
                    ? "bg-blue-900/20"
                    : "hover:bg-zinc-800/30"
                }`}
              >
                <td className="px-3 py-3 font-mono text-xs text-zinc-500">
                  {entry.rank}
                  {entry.rank === 1
                    ? "st"
                    : entry.rank === 2
                      ? "nd"
                      : entry.rank === 3
                        ? "rd"
                        : "th"}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-medium ${
                          isMe ? "text-blue-400" : "text-white"
                        }`}
                      >
                        {entry.username}
                      </span>
                      {isMe && (
                        <span className="rounded bg-blue-900/40 px-1.5 py-0.5 text-[10px] text-blue-400">
                          Vos
                        </span>
                      )}
                      {entry.rank === 1 && entry.total_points > 0 && (
                        <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-500 border border-yellow-500/30">
                          Nostradamus 👑
                        </span>
                      )}
                      {entry.rank > 1 && entry.rank === entries[entries.length - 1].rank && entries.length > 2 && entry.total_points < entries[0].total_points && (
                        <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">
                          Hijo de todos 🍼
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-mono text-base font-bold text-white">
                  {entry.total_points}
                </td>
                <td className="hidden px-3 py-3 text-right font-mono text-xs text-zinc-400 sm:table-cell">
                  {entry.exact_scores}
                </td>
                <td className="hidden px-3 py-3 text-right font-mono text-xs text-zinc-400 sm:table-cell">
                  {entry.correct_results}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
