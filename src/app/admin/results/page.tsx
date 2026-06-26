"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type Match = {
  id: number;
  home_team: string;
  away_team: string;
  round_name: string;
  group_name: string | null;
  home_score: number | null;
  away_score: number | null;
};

export default function ResultsPage() {
  const supabase = createClient();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [scoredCount, setScoredCount] = useState(0);

  useEffect(() => {
    supabase
      .from("matches")
      .select("*")
      .order("kickoff_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMatches(data);
      });
  }, []);

  async function handleSelectMatch(matchId: string) {
    setSelectedMatchId(matchId);
    const match = matches.find((m) => m.id.toString() === matchId);
    if (match) {
      setHomeScore(match.home_score?.toString() ?? "");
      setAwayScore(match.away_score?.toString() ?? "");
    }
    setSuccess(false);
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const h = parseInt(homeScore, 10);
    const a = parseInt(awayScore, 10);

    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setError("Ingresá marcadores válidos");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/admin/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: parseInt(selectedMatchId, 10),
        homeScore: h,
        awayScore: a,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error || "Failed to save result");
      setSaving(false);
      return;
    }

    const data = await res.json();
    setSuccess(true);
    setScoredCount(data.predictionsScored ?? 0);
    setSaving(false);
  }

  const selectedMatch = selectedMatchId
    ? matches.find((m) => m.id.toString() === selectedMatchId)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-white">Resultados de Partidos</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {/* Match selector */}
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">
            Seleccionar Partido
          </label>
          <select
            value={selectedMatchId}
            onChange={(e) => handleSelectMatch(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-[#111118] px-3 py-2.5 text-white outline-none focus:border-zinc-500"
          >
            <option value="">— Seleccioná un partido —</option>
            {matches.map((match) => (
              <option key={match.id} value={match.id}>
                {match.home_team} vs {match.away_team} ({match.round_name}
                {match.group_name ? ` · Group ${match.group_name}` : ""}
                {match.home_score !== null
                  ? ` · ${match.home_score}–${match.away_score}`
                  : ""})
              </option>
            ))}
          </select>
        </div>

        {selectedMatch && (
          <>
            {/* Score inputs */}
            <div className="rounded-xl border border-zinc-800 bg-[#1a1a24] p-4">
              <p className="mb-3 text-center text-sm text-zinc-400">
                {selectedMatch.home_team} vs {selectedMatch.away_team}
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <label className="mb-1 block text-xs text-zinc-500">
                    {selectedMatch.home_team}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    className="w-20 rounded-lg border border-zinc-700 bg-[#111118] px-3 py-2 text-center text-xl font-bold text-white outline-none focus:border-zinc-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    required
                  />
                </div>
                <span className="text-lg text-zinc-600">vs</span>
                <div className="text-center">
                  <label className="mb-1 block text-xs text-zinc-500">
                    {selectedMatch.away_team}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    className="w-20 rounded-lg border border-zinc-700 bg-[#111118] px-3 py-2 text-center text-xl font-bold text-white outline-none focus:border-zinc-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-green-600 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Guardando y Puntuando…" : "Guardar Resultado"}
            </button>
          </>
        )}

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {success && (
          <div className="rounded-xl border border-green-800 bg-green-900/20 p-4 text-center">
            <p className="text-sm text-green-400">
              ¡Resultado guardado! {scoredCount} pronóstico{scoredCount !== 1 ? "s" : ""} puntuado{scoredCount !== 1 ? "s" : ""}.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
