"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { TEAM_NAMES_ES } from "@/lib/sync/teams-es";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type BonusPrediction = {
  top_scorer: string | null;
  revelation_1: string | null;
  revelation_2: string | null;
  disappointment_1: string | null;
  disappointment_2: string | null;
} | null;

export default function BonusPredictionsCard({
  userId,
  isLocked,
  participatingTeams,
}: {
  userId: string;
  isLocked: boolean;
  participatingTeams: string[];
}) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const queryKey = ["bonus_predictions", userId] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data: dbData } = await supabase
        .from("bonus_predictions")
        .select("*")
        .eq("user_id", userId)
        .single();
      return dbData as BonusPrediction;
    },
  });

  const [showInfo, setShowInfo] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [topScorer, setTopScorer] = useState("");
  const [rev1, setRev1] = useState("");
  const [rev2, setRev2] = useState("");
  const [dec1, setDec1] = useState("");
  const [dec2, setDec2] = useState("");

  const teams = participatingTeams
    .map((code) => ({ code, name: TEAM_NAMES_ES[code] ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (data) {
      setTopScorer(data.top_scorer || "");
      setRev1(data.revelation_1 || "");
      setRev2(data.revelation_2 || "");
      setDec1(data.disappointment_1 || "");
      setDec2(data.disappointment_2 || "");
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (newBonus: any) => {
      if (!navigator.onLine) {
        throw new Error("No podés guardar sin conexión.");
      }
      const { error } = await supabase.from("bonus_predictions").upsert(
        newBonus,
        { onConflict: "user_id" }
      );
      if (error) throw new Error(error.message);
    },
    onMutate: async (newBonus) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, { ...(previous as any || {}), ...newBonus });
      return { previous };
    },
    onError: (err, newBonus, context) => {
      setError(err.message);
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  function handleSave() {
    setError(null);
    setSuccess(false);
    mutation.mutate({
      user_id: userId,
      top_scorer: topScorer,
      revelation_1: rev1,
      revelation_2: rev2,
      disappointment_1: dec1,
      disappointment_2: dec2,
    });
  }

  const saving = mutation.isPending;

  if (isLoading) return null;

  return (
    <div className="mb-6 rounded-xl border border-purple-900/30 bg-purple-900/10 p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-purple-600/10 blur-3xl" />
      
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>🌟</span> Bonus Track
        </h2>
        <button 
          onClick={() => setShowInfo(true)}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400 hover:text-white"
        >
          i
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Goleador */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-zinc-400">GOLEADOR DEL TORNEO (10 pts)</label>
          <input
            type="text"
            value={topScorer}
            onChange={(e) => setTopScorer(e.target.value)}
            disabled={isLocked}
            placeholder="Ej: Kylian Mbappé"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-white focus:border-purple-500 focus:outline-none disabled:opacity-50"
          />
          {(() => {
            const n = topScorer.toLowerCase();
            if (!n || n.length < 3) return null;
            let reaction = null;
            if (n.includes("messi")) reaction = "Obvio, pa. El GOAT no se discute. 🐐";
            else if (n.includes("mbappe") || n.includes("mbappé")) reaction = "¿Elegiste a la tortuga? A este le gusta el segundo puesto. 🐢";
            else if (n.includes("cristiano") || n.includes("ronaldo") || n.includes("cr7")) reaction = "Avisale que el Mundial no se juega en Arabia... 👀";
            else if (n.includes("garnacho") || n.includes("bicho")) reaction = "¡Qué viva el fútbol, pibe! 🚲";
            else if (n.includes("lautaro") || n.includes("toro") || n.includes("martinez")) reaction = "Me vuelvo loco, Toro. 🐂";
            else if (n.includes("julian") || n.includes("julián") || n.includes("araña")) reaction = "Pica la araña. 🕷️";
            else if (n.includes("haaland")) reaction = "Ojo que es un androide, no sé si vale. 🤖";
            else if (n.includes("kane")) reaction = "Cuidado que este tiene alergia a las finales. 🤧";
            else if (n.includes("vinicius") || n.includes("vini")) reaction = "A ver si acá no lo tapan... 🕺";

            if (reaction) {
              return <p className="text-[11px] font-medium italic text-purple-400">{reaction}</p>;
            }
            return null;
          })()}
        </div>

        {/* Revelaciones */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-zinc-400">REVELACIONES (1 pt c/u)</label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={rev1}
              onChange={(e) => setRev1(e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-white focus:border-purple-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">Seleccionar...</option>
              {teams.map(({code, name}) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
            <select
              value={rev2}
              onChange={(e) => setRev2(e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-white focus:border-purple-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">Seleccionar...</option>
              {teams.map(({code, name}) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Decepciones */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-zinc-400">DECEPCIONES (1 pt c/u)</label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={dec1}
              onChange={(e) => setDec1(e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-white focus:border-purple-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">Seleccionar...</option>
              {teams.map(({code, name}) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
            <select
              value={dec2}
              onChange={(e) => setDec2(e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-white focus:border-purple-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">Seleccionar...</option>
              {teams.map(({code, name}) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {!isLocked && (
          <button
            onClick={handleSave}
            disabled={saving}
            className={`mt-2 w-full rounded-xl py-3 text-sm font-bold text-white transition-colors ${
              success ? "bg-green-600" : "bg-purple-600 hover:bg-purple-500"
            } disabled:opacity-50`}
          >
            {saving ? "Guardando..." : success ? "¡Guardado!" : "Guardar Bonus"}
          </button>
        )}
      </div>

      {/* Modal de Información */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#111118] p-6 shadow-2xl border border-zinc-800">
            <h3 className="mb-4 text-xl font-bold text-white">Reglas del Bonus Track</h3>
            <div className="flex flex-col gap-4 text-sm text-zinc-300">
              <p>
                <strong className="text-purple-400">Goleador del Torneo (+10 pts):</strong><br/>
                El jugador que anote más goles en todo el mundial. Si hay empate oficial, todos suman.
              </p>
              <p>
                <strong className="text-purple-400">Equipos Revelación (+1 pt):</strong><br/>
                Para sumar este punto, el equipo seleccionado debe clasificar al menos a los <strong>Cuartos de Final (4tos)</strong>.
              </p>
              <p>
                <strong className="text-purple-400">Equipos Decepción (+1 pt):</strong><br/>
                Para sumar este punto, el equipo seleccionado debe quedar eliminado en <strong>16avos de Final (Ronda de 32)</strong> o antes.
              </p>
              <p className="text-xs text-zinc-500 mt-2 italic">
                *Nota: Las selecciones se bloquearán al comenzar los partidos de eliminación directa. El Administrador verificará los equipos que cumplan estas reglas al final del torneo.
              </p>
            </div>
            <button
              onClick={() => setShowInfo(false)}
              className="mt-6 w-full rounded-xl bg-zinc-800 py-3 font-bold text-white transition-colors hover:bg-zinc-700"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
