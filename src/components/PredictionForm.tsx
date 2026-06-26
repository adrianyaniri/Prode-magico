"use client";

import { createClient } from "@/lib/supabase/client";
import { isBefore, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TEAM_NAMES_ES } from "@/lib/sync/teams-es";
import { TEAM_CRESTS } from "@/lib/sync/teams-crests";

type Prediction = {
  id: number;
  home_score: number;
  away_score: number;
  points: number | null;
  predicted_advancer?: string | null;
} | null;

export default function PredictionForm({
  matchId,
  kickoffAt,
  existingPrediction,
  userId,
  homeTeam,
  awayTeam,
  isKnockout,
}: {
  matchId: number;
  kickoffAt: string;
  existingPrediction: Prediction;
  userId: string;
  homeTeam: string;
  awayTeam: string;
  isKnockout?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [homeScore, setHomeScore] = useState(
    existingPrediction?.home_score ?? 0,
  );
  const [awayScore, setAwayScore] = useState(
    existingPrediction?.away_score ?? 0,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [predictedAdvancer, setPredictedAdvancer] = useState<string | null>(
    existingPrediction?.predicted_advancer ?? null
  );

  const isDraw = homeScore === awayScore;
  const showPenaltySelector = isKnockout && isDraw;

  const kickoff = parseISO(kickoffAt);
  const isPast = isBefore(kickoff, new Date());
  if (isPast) return null;

  function handleIncrementHome() {
    setHomeScore((prev) => Math.min(prev + 1, 20));
    setSuccess(false);
  }
  function handleDecrementHome() {
    setHomeScore((prev) => Math.max(prev - 1, 0));
    setSuccess(false);
  }
  function handleIncrementAway() {
    setAwayScore((prev) => Math.min(prev + 1, 20));
    setSuccess(false);
  }
  function handleDecrementAway() {
    setAwayScore((prev) => Math.max(prev - 1, 0));
    setSuccess(false);
  }

  async function handleSubmit() {
    setError(null);
    setSaving(true);

    const { error: upsertError } = await supabase.from("predictions").upsert(
      {
        user_id: userId,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        predicted_advancer: showPenaltySelector ? predictedAdvancer : null,
      },
      {
        onConflict: "user_id, match_id",
        ignoreDuplicates: false,
      },
    );

    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    const phrases = [
      "Guardado. Si le pegás, pago el asado. 🥩",
      "Guardado. Que Dios y la Patria te lo demanden. 🇦🇷",
      "Guardado. Anulo mufa 🤞",
      "Guardado. Se nota que sabés de fútbol. ⚽",
      "Guardado. Alta fe le tenés. 🙏",
    ];
    setSuccessMsg(phrases[Math.floor(Math.random() * phrases.length)]);
    setSuccess(true);
    setSaving(false);
    router.refresh();
  }

  if (success) {
    return (
      <div className="mt-4 rounded-xl border border-green-900/50 bg-green-900/20 p-4 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-bold text-green-400">
            {successMsg || (existingPrediction ? "¡Pronóstico Actualizado!" : "¡Pronóstico Guardado!")}
          </span>
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-4">
            <span className="text-sm font-medium text-white">{TEAM_NAMES_ES[homeTeam] ?? homeTeam}</span>
            <span className="text-xl font-bold text-white">{homeScore}</span>
          </div>
          <div className="flex items-center justify-between px-4">
            <span className="text-sm font-medium text-white">{TEAM_NAMES_ES[awayTeam] ?? awayTeam}</span>
            <span className="text-xl font-bold text-white">{awayScore}</span>
          </div>
          {existingPrediction?.predicted_advancer && (
            <div className="mt-2 text-center text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
              {TEAM_NAMES_ES[existingPrediction.predicted_advancer] ?? existingPrediction.predicted_advancer} pasa por penales
            </div>
          )}
        </div>

        <button
          onClick={() => setSuccess(false)}
          className="mt-4 w-full rounded-lg bg-zinc-800 py-2.5 text-xs font-bold text-white transition-colors hover:bg-zinc-700"
        >
          Modificar
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-3">
      {/* Fila Local */}
      <div className="flex items-center justify-between rounded-lg bg-zinc-800/30 p-2">
        <div className="flex items-center gap-3">
          {TEAM_CRESTS[homeTeam] && (
            <img src={TEAM_CRESTS[homeTeam]} alt={homeTeam} className="h-8 w-8 object-contain" />
          )}
          <span className="text-base font-bold text-white">
            {TEAM_NAMES_ES[homeTeam] ?? homeTeam}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDecrementHome}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-2xl font-bold text-white transition-colors hover:bg-zinc-700 active:bg-zinc-600"
          >
            -
          </button>
          <span className="w-6 text-center text-2xl font-bold text-white">{homeScore}</span>
          <button
            onClick={handleIncrementHome}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-2xl font-bold text-white transition-colors hover:bg-zinc-700 active:bg-zinc-600"
          >
            +
          </button>
        </div>
      </div>

      {/* Fila Visitante */}
      <div className="flex items-center justify-between rounded-lg bg-zinc-800/30 p-2">
        <div className="flex items-center gap-3">
          {TEAM_CRESTS[awayTeam] && (
            <img src={TEAM_CRESTS[awayTeam]} alt={awayTeam} className="h-8 w-8 object-contain" />
          )}
          <span className="text-base font-bold text-white">
            {TEAM_NAMES_ES[awayTeam] ?? awayTeam}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDecrementAway}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-2xl font-bold text-white transition-colors hover:bg-zinc-700 active:bg-zinc-600"
          >
            -
          </button>
          <span className="w-6 text-center text-2xl font-bold text-white">{awayScore}</span>
          <button
            onClick={handleIncrementAway}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-2xl font-bold text-white transition-colors hover:bg-zinc-700 active:bg-zinc-600"
          >
            +
          </button>
        </div>
      </div>

      {/* Selector de Penales */}
      {showPenaltySelector && (
        <div className="mt-1 rounded-lg border border-yellow-900/30 bg-yellow-900/10 p-3">
          <p className="mb-2 text-center text-xs font-medium text-yellow-500">
            Partido de eliminatoria empatado.<br/>¿Quién clasifica por penales?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPredictedAdvancer(homeTeam)}
              className={`rounded-lg border py-2 text-xs font-bold transition-colors ${
                predictedAdvancer === homeTeam
                  ? "border-yellow-500 bg-yellow-500/20 text-yellow-400"
                  : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {TEAM_NAMES_ES[homeTeam] ?? homeTeam}
            </button>
            <button
              onClick={() => setPredictedAdvancer(awayTeam)}
              className={`rounded-lg border py-2 text-xs font-bold transition-colors ${
                predictedAdvancer === awayTeam
                  ? "border-yellow-500 bg-yellow-500/20 text-yellow-400"
                  : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {TEAM_NAMES_ES[awayTeam] ?? awayTeam}
            </button>
          </div>
        </div>
      )}

      {/* Mensaje Empate 0-0 */}
      {homeScore === 0 && awayScore === 0 && !isKnockout && (
        <div className="mt-1 mb-1 text-center text-[11px] font-medium italic text-zinc-500">
          😴 Partido ideal para dormir la siesta
        </div>
      )}

      {/* Botón Guardar */}
      <button
        onClick={handleSubmit}
        disabled={saving || (showPenaltySelector && !predictedAdvancer)}
        className="mt-2 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-colors hover:bg-blue-500 disabled:opacity-50"
      >
        {saving
          ? "Guardando..."
          : existingPrediction
            ? "Actualizar Pronóstico"
            : "Guardar Pronóstico"}
      </button>

      {error && (
        <p className="text-center text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
