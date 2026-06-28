"use client";

import { isBefore, parseISO } from "date-fns";
import PredictionForm from "./PredictionForm";
import { TEAM_NAMES_ES } from "@/lib/sync/teams-es";
import { TEAM_CRESTS } from "@/lib/sync/teams-crests";
import { esRound } from "@/lib/sync/round-names";

type Match = {
  id: number;
  home_team: string;
  away_team: string;
  round_name: string;
  group_name: string | null;
  kickoff_at: string;
  home_score: number | null;
  away_score: number | null;
};

type Prediction = {
  id: number;
  home_score: number;
  away_score: number;
  points: number | null;
} | null;

export default function MatchCard({
  match,
  prediction,
  userId,
  hidePrediction = false,
}: {
  match: Match;
  prediction: Prediction;
  userId: string;
  hidePrediction?: boolean;
}) {
  const kickoff = parseISO(match.kickoff_at);
  const isPast = isBefore(kickoff, new Date());
  const roundLabel = esRound(match.round_name);
  const isGroupStage = match.round_name === "Group Stage";
  const hasResult = match.home_score !== null;
  const canPredict = !isGroupStage && !isPast;
  const isLocked = !isGroupStage && isPast && !hasResult;

  const showPredictionForm = canPredict && !hidePrediction;

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#1a1a24] p-4 shadow-sm">
      {/* Round badge & Date Header */}
      <div className="mb-4 flex items-center justify-between border-b border-zinc-800/50 pb-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            {roundLabel}
            {match.group_name ? ` · GRP ${match.group_name}` : ""}
          </span>
          {hasResult && (
            <span className="rounded-full bg-green-900/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
              Finalizado
            </span>
          )}
          {isLocked && (
            <span className="rounded-full bg-yellow-900/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
              Bloqueado
            </span>
          )}
        </div>
        <span className="text-right text-xs font-medium text-zinc-500">
          {new Date(match.kickoff_at).toLocaleDateString("es", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {showPredictionForm ? (
        <PredictionForm
          matchId={match.id}
          kickoffAt={match.kickoff_at}
          existingPrediction={prediction}
          userId={userId}
          homeTeam={match.home_team}
          awayTeam={match.away_team}
          isKnockout={!isGroupStage}
        />
      ) : (
        /* Read-only Vertical View */
        <div className="flex flex-col gap-3">
          {/* Fila Local */}
          <div className="flex items-center justify-between rounded-lg bg-zinc-800/20 p-2">
            <div className="flex items-center gap-3">
              {TEAM_CRESTS[match.home_team] && (
                <img src={TEAM_CRESTS[match.home_team]} alt={match.home_team} className="h-6 w-6 object-contain" />
              )}
              <span className="text-sm font-bold text-white">
                {TEAM_NAMES_ES[match.home_team] ?? match.home_team}
              </span>
            </div>
            {hasResult && (
              <span className="text-lg font-bold text-white">{match.home_score}</span>
            )}
          </div>

          {/* Fila Visitante */}
          <div className="flex items-center justify-between rounded-lg bg-zinc-800/20 p-2">
            <div className="flex items-center gap-3">
              {TEAM_CRESTS[match.away_team] && (
                <img src={TEAM_CRESTS[match.away_team]} alt={match.away_team} className="h-6 w-6 object-contain" />
              )}
              <span className="text-sm font-bold text-white">
                {TEAM_NAMES_ES[match.away_team] ?? match.away_team}
              </span>
            </div>
            {hasResult && (
              <span className="text-lg font-bold text-white">{match.away_score}</span>
            )}
          </div>

          {/* Tu pronóstico */}
          {(hasResult || isLocked) && prediction && (
            <div className="mt-2 flex items-center justify-between rounded-lg border border-zinc-700/50 bg-zinc-800/30 px-3 py-2">
              <span className="text-xs font-medium text-zinc-400">Tu pronóstico:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {prediction.home_score} – {prediction.away_score}
                </span>
                {prediction.points !== null && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${prediction.points > 0 ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                    +{prediction.points} pts
                  </span>
                )}
                {isLocked && prediction.points === null && (
                  <span className="text-[10px] uppercase tracking-wider text-yellow-500 font-bold ml-1" title="Partido en juego - Pronóstico bloqueado">
                    🔒
                  </span>
                )}
              </div>
            </div>
          )}

          {(hasResult || isLocked) && !prediction && (
            <div className="mt-2 text-center rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-3 py-2">
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Sin pronóstico</span>
            </div>
          )}

          {isGroupStage && !hasResult && (
            <p className="mt-1 text-center text-[10px] uppercase tracking-wider text-zinc-500">
              Resultado pendiente
            </p>
          )}
        </div>
      )}
    </div>
  );
}
