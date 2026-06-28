"use client";

import { createClient } from "@/lib/supabase/client";
import { isBefore, parseISO } from "date-fns";
import { useState } from "react";
import { TEAM_NAMES_ES } from "@/lib/sync/teams-es";
import { TEAM_CRESTS } from "@/lib/sync/teams-crests";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  const supabase = createClient();
  const queryClient = useQueryClient();

  const queryKey = ["predictions", userId, matchId] as const;

  const { data: prediction } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", userId)
        .eq("match_id", matchId)
        .single();
      return data as Prediction;
    },
    initialData: existingPrediction,
  });

  const [homeScore, setHomeScore] = useState(prediction?.home_score ?? 0);
  const [awayScore, setAwayScore] = useState(prediction?.away_score ?? 0);
  const [predictedAdvancer, setPredictedAdvancer] = useState<string | null>(
    prediction?.predicted_advancer ?? null
  );

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isDraw = homeScore === awayScore;
  const showPenaltySelector = isKnockout && isDraw;

  const kickoff = parseISO(kickoffAt);
  const isPast = isBefore(kickoff, new Date());

  const mutation = useMutation({
    mutationFn: async (newPrediction: any) => {
      if (!navigator.onLine) {
        throw new Error("No podés guardar sin conexión.");
      }
      const { error: upsertError } = await supabase.from("predictions").upsert(
        newPrediction,
        {
          onConflict: "user_id, match_id",
          ignoreDuplicates: false,
        }
      );
      if (upsertError) throw new Error(upsertError.message);
    },
    onMutate: async (newPrediction) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, { ...(previous as any || {}), ...newPrediction });
      return { previous };
    },
    onError: (err, newPrediction, context) => {
      setError(err.message);
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      const totalGoals = homeScore + awayScore;
      const goalDiff = Math.abs(homeScore - awayScore);
      let jokeMsg = null;

      if (homeScore === 0 && awayScore === 0) {
        jokeMsg = isKnockout 
          ? "🛡️ Catenaccio puro y a cortar clavos con el culo en los penales." 
          : "😴 0 a 0 clavadísimo. Un dolor de ojos digno del ascenso.";
      } else if (homeScore === 7 && awayScore === 1) {
        jokeMsg = "🇧🇷 ¿Siete a uno? Decime cómo se siente... Guardado.";
      } else if (goalDiff >= 4) {
        jokeMsg = "🚑 ¡Llamen al SAME que lo sacan en camilla! Baile total.";
      } else if (totalGoals >= 6) {
        jokeMsg = "🚬 ¡Fútbol champagne y fulbito del bueno! Guardado.";
      } else if (homeScore === awayScore && homeScore > 0) {
        jokeMsg = isKnockout
          ? "🚑 Partido no apto para cardíacos. Directo a la ruleta de los penales."
          : "🤝 Se conformaron con el puntito inteligente. Guardado.";
      } else if (totalGoals === 1) {
        jokeMsg = "🤏 Un medio a cero a lo Bilardo. Arafue el tiki-tiki.";
      }

      if (!jokeMsg) {
        const phrases = [
          "Guardado. Si le pegás, hoy pago el asado yo. 🥩",
          "Anotado. Ni el pulpo Paul se animó a tanto. 🐙",
          "Guardado. Anulo mufa por las dudas. 🤞",
          "Guardado. Scaloni estaría orgulloso de este pronóstico. 🧢",
          "Guardado. Si sale esto, sos el Nostradamus del Conurbano. 🔮",
        ];
        jokeMsg = phrases[Math.floor(Math.random() * phrases.length)];
      }

      setSuccessMsg(jokeMsg);
      setSuccess(true);
    },
  });

  if (isPast) {
    if (!prediction) {
      return (
        <div className="mt-3 rounded-xl border border-red-900/30 bg-red-900/10 p-3 text-center">
          <p className="text-xs font-medium text-red-400">El partido ya empezó y no llegaste a cargar pronóstico. 😢</p>
        </div>
      );
    }

    return (
      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            🔒 Tu pronóstico (Bloqueado)
          </span>
        </div>
        
        <div className="flex flex-col gap-2 opacity-80">
          <div className="flex items-center justify-between px-4">
            <span className="text-sm font-medium text-white">{TEAM_NAMES_ES[homeTeam] ?? homeTeam}</span>
            <span className="text-xl font-bold text-white">{prediction.home_score}</span>
          </div>
          <div className="flex items-center justify-between px-4">
            <span className="text-sm font-medium text-white">{TEAM_NAMES_ES[awayTeam] ?? awayTeam}</span>
            <span className="text-xl font-bold text-white">{prediction.away_score}</span>
          </div>
          {prediction.predicted_advancer && (
            <div className="mt-2 text-center text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
              {TEAM_NAMES_ES[prediction.predicted_advancer] ?? prediction.predicted_advancer} pasa por penales
            </div>
          )}
        </div>
      </div>
    );
  }

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
    mutation.mutate({
      user_id: userId,
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore,
      predicted_advancer: showPenaltySelector ? predictedAdvancer : null,
    });
  }

  const saving = mutation.isPending;

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
            <span className="flex items-center gap-2 text-sm font-bold text-white">
              {TEAM_NAMES_ES[homeTeam] ?? homeTeam}
              {TEAM_CRESTS[homeTeam] && <img src={TEAM_CRESTS[homeTeam]} alt="" className="h-4 w-4 object-contain" />}
            </span>
            <span className="text-xl font-bold text-white">{homeScore}</span>
          </div>
          <div className="flex items-center justify-between px-4">
            <span className="flex items-center gap-2 text-sm font-bold text-white">
              {TEAM_CRESTS[awayTeam] && <img src={TEAM_CRESTS[awayTeam]} alt="" className="h-4 w-4 object-contain" />}
              {TEAM_NAMES_ES[awayTeam] ?? awayTeam}
            </span>
            <span className="text-xl font-bold text-white">{awayScore}</span>
          </div>
          {prediction?.predicted_advancer && (
            <div className="mt-2 text-center text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
              {TEAM_NAMES_ES[prediction.predicted_advancer] ?? prediction.predicted_advancer} pasa por penales
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
          <span className="flex items-center gap-2 font-bold text-white">
            {TEAM_CRESTS[homeTeam] && <img src={TEAM_CRESTS[homeTeam]} alt="" className="h-5 w-5 object-contain" />}
            {TEAM_NAMES_ES[homeTeam] ?? homeTeam}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDecrementHome}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-2xl font-bold text-white transition-all hover:bg-zinc-700 active:scale-90 active:bg-zinc-600"
          >
            -
          </button>
          <div key={`home-${homeScore}`} className="w-10 text-center text-3xl font-black text-white animate-pop">
            {homeScore}
          </div>
          <button
            onClick={handleIncrementHome}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-2xl font-bold text-white transition-all hover:bg-zinc-700 active:scale-90 active:bg-zinc-600"
          >
            +
          </button>
        </div>
      </div>

      {/* Fila Visitante */}
      <div className="flex items-center justify-between rounded-lg bg-zinc-800/30 p-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 font-bold text-white">
            {TEAM_NAMES_ES[awayTeam] ?? awayTeam}
            {TEAM_CRESTS[awayTeam] && <img src={TEAM_CRESTS[awayTeam]} alt="" className="h-5 w-5 object-contain" />}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDecrementAway}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-2xl font-bold text-white transition-all hover:bg-zinc-700 active:scale-90 active:bg-zinc-600"
          >
            -
          </button>
          <div key={`away-${awayScore}`} className="w-10 text-center text-3xl font-black text-white animate-pop">
            {awayScore}
          </div>
          <button
            onClick={handleIncrementAway}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-2xl font-bold text-white transition-all hover:bg-zinc-700 active:scale-90 active:bg-zinc-600"
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

      {/* Botón Guardar */}
      <button
        onClick={handleSubmit}
        disabled={saving || (showPenaltySelector && !predictedAdvancer)}
        className="mt-2 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-colors hover:bg-blue-500 disabled:opacity-50"
      >
        {saving
          ? "Guardando..."
          : prediction
            ? "Actualizar Pronóstico"
            : "Guardar Pronóstico"}
      </button>

      {error && (
        <p className="mt-2 text-center text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
