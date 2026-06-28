"use client";

import { useState } from "react";
import MatchCard from "@/components/MatchCard";
import { isToday, isTomorrow, parseISO, isPast } from "date-fns";

export default function MatchesFilter({
  matches,
  predictions,
  userId,
  rounds,
}: {
  matches: any[];
  predictions: any[];
  userId: string;
  rounds: string[];
}) {
  const [filter, setFilter] = useState<"all" | "today" | "tomorrow" | "pending" | "finished">("all");

  const predictionsMap = new Map(predictions.map((p) => [p.match_id, p]));

  const filteredMatches = matches.filter((m) => {
    if (filter === "all") return true;
    if (filter === "pending") {
      const hasPrediction = predictionsMap.has(m.id);
      const past = isPast(parseISO(m.kickoff_at));
      return !hasPrediction && !past;
    }
    if (filter === "finished") {
      return m.home_score !== null;
    }
    const kickoff = parseISO(m.kickoff_at);
    if (filter === "today") return isToday(kickoff);
    if (filter === "tomorrow") return isTomorrow(kickoff);
    return true;
  });

  const matchesByRound: Record<string, any[]> = {};
  for (const match of filteredMatches) {
    if (!matchesByRound[match.round_name]) matchesByRound[match.round_name] = [];
    matchesByRound[match.round_name].push(match);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === "all" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>Todos</button>
        <button onClick={() => setFilter("today")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === "today" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>Hoy</button>
        <button onClick={() => setFilter("tomorrow")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === "tomorrow" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>Mañana</button>
        <button onClick={() => setFilter("pending")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === "pending" ? "bg-yellow-600 text-white shadow-[0_0_10px_rgba(202,138,4,0.3)]" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>Mis Pendientes</button>
        <button onClick={() => setFilter("finished")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === "finished" ? "bg-green-700 text-white shadow-[0_0_10px_rgba(21,128,61,0.3)]" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>Finalizados</button>
      </div>

      {filteredMatches.length === 0 && (
        <div className="rounded-xl border border-zinc-800 bg-[#1a1a24] p-8 text-center">
          <p className="text-zinc-500">No hay partidos para este filtro.</p>
        </div>
      )}

      {rounds.map((round) => {
        const roundMatches = matchesByRound[round];
        if (!roundMatches?.length) return null;
        return (
          <div key={round} className="mb-6">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              {round}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roundMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predictionsMap.get(match.id) ?? null}
                  userId={userId}
                  hidePrediction={false}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
