"use client";

import { createClient } from "@/lib/supabase/client";
import { TEAM_NAMES_ES } from "@/lib/sync/teams-es";
import { esRound } from "@/lib/sync/round-names";
import { useCallback, useEffect, useRef, useState } from "react";

type Match = {
  id: number;
  home_team: string;
  away_team: string;
  round_name: string;
  group_name: string | null;
  home_score: number | null;
  away_score: number | null;
  kickoff_at: string;
};

function es(team: string): string {
  return TEAM_NAMES_ES[team] ?? team;
}

const ROUND_ORDER = [
  "Group Stage",
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Third Place",
  "Final",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  const refreshMatches = useCallback(async () => {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .order("kickoff_at", { ascending: true });
    if (data) setMatches(data);
    return data ?? [];
  }, []);

  useEffect(() => {
    refreshMatches().then((data) => {
      const now = new Date().toISOString();
      const firstPending = data.find(
        (m: Match) => m.kickoff_at < now && m.home_score === null,
      );
      if (firstPending) {
        setSelectedMatchId(firstPending.id.toString());
        setHomeScore("");
        setAwayScore("");
      }
    });
  }, [refreshMatches]);

  function handleSelectMatch(matchId: string) {
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
      setError(err.error || "Error al guardar");
      setSaving(false);
      return;
    }

    const data = await res.json();
    setScoredCount(data.predictionsScored ?? 0);

    // Refresh matches and auto-advance to next pending
    const refreshed = await refreshMatches();
    const now = new Date().toISOString();
    const nextPending = refreshed.find(
      (m: Match) => m.kickoff_at < now && m.home_score === null,
    );

    if (nextPending) {
      setSelectedMatchId(nextPending.id.toString());
      setHomeScore("");
      setAwayScore("");
      setSuccess(true);
    } else {
      setSelectedMatchId("");
      setHomeScore("");
      setAwayScore("");
      setSuccess(true);
    }
    setSaving(false);
  }

  async function handleQuickSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/sync-results", { method: "POST" });
      const d = await res.json();
      if (res.ok) {
        const msg = d.synced > 0 || d.scored > 0
          ? `OK: ${d.synced} partidos actualizados, ${d.scored} pronósticos puntuados`
          : "Sin novedades — resultados ya estaban actualizados";
        setSyncResult(msg);
      } else {
        setSyncResult(`Error: ${d.error}`);
      }
      const refreshed = await refreshMatches();
      const now = new Date().toISOString();
      const firstPending = refreshed.find(
        (m: Match) => m.kickoff_at < now && m.home_score === null,
      );
      if (firstPending) {
        setSelectedMatchId(firstPending.id.toString());
        setHomeScore("");
        setAwayScore("");
      }
    } catch {
      setSyncResult("Error de red");
    } finally {
      setSyncing(false);
    }
  }

  const now = new Date().toISOString();

  const grouped = ROUND_ORDER.map((round) => {
    const roundMatches = matches.filter((m) => m.round_name === round);
    const pending = roundMatches.filter(
      (m) => m.kickoff_at < now && m.home_score === null,
    );
    const done = roundMatches.filter((m) => m.home_score !== null);
    const upcoming = roundMatches.filter(
      (m) => m.kickoff_at >= now && m.home_score === null,
    );

    let filtered = roundMatches;
    if (filter === "pending") filtered = [...pending, ...upcoming];
    if (filter === "done") filtered = done;

    return {
      round,
      total: roundMatches.length,
      pending: pending.length,
      done: done.length,
      upcoming: upcoming.length,
      matches: filtered,
    };
  }).filter((g) => g.matches.length > 0);

  const pendingCount = matches.filter(
    (m) => m.kickoff_at < now && m.home_score === null,
  ).length;

  const selectedMatch = selectedMatchId
    ? matches.find((m) => m.id.toString() === selectedMatchId)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Resultados</h1>
          {pendingCount > 0 && (
            <p className="text-xs text-amber-400">{pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}</p>
          )}
        </div>
        <button
          onClick={handleQuickSync}
          disabled={syncing}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-zinc-700 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 disabled:opacity-50"
        >
          {syncing ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sincronizando…
            </>
          ) : (
            "Sincronizar desde API"
          )}
        </button>
      </div>

      {syncResult && (
        <div className={`rounded-lg border p-2 text-center text-xs ${
          syncResult.startsWith("OK") || syncResult.startsWith("Sin")
            ? "border-green-800 bg-green-900/20 text-green-400"
            : "border-red-800 bg-red-900/20 text-red-400"
        }`}>
          {syncResult}
        </div>
      )}

      {pendingCount === 0 && matches.length > 0 && (
        <div className="rounded-lg border border-green-800 bg-green-900/20 p-3 text-center text-sm text-green-400">
          Todos los resultados están cargados. ¡Disfrutá el Mundial!
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {(["all", "pending", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-zinc-700 text-white"
                : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {f === "all" ? "Todos" : f === "pending" ? "Pendientes" : "Con resultado"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">
            Seleccionar Partido
          </label>
          <select
            ref={selectRef}
            value={selectedMatchId}
            onChange={(e) => handleSelectMatch(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-[#111118] px-3 py-2.5 text-white outline-none focus:border-zinc-500"
          >
            <option value="">— Seleccioná un partido —</option>
            {grouped.map((g) => (
              <optgroup key={g.round} label={`${g.round} (${g.pending > 0 ? `${g.pending} pend, ` : ""}${g.done} ok${g.upcoming > 0 ? `, ${g.upcoming} próx` : ""})`}>
                {g.matches.map((match) => {
                  const isPending = match.kickoff_at < now && match.home_score === null;
                  const isDone = match.home_score !== null;
                  return (
                    <option key={match.id} value={match.id}>
                      {es(match.home_team)} vs {es(match.away_team)}
                      {match.group_name ? ` (Grupo ${match.group_name})` : ""}
                      {isDone
                        ? ` · ${match.home_score}–${match.away_score}`
                        : isPending
                          ? " · ⏰ PENDIENTE"
                          : ""}
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>
        </div>

        {selectedMatch && (
          <>
            <div className="rounded-xl border border-zinc-800 bg-[#1a1a24] p-4">
              <p className="mb-1 text-center text-xs text-zinc-500">
                {esRound(selectedMatch.round_name)}
                {selectedMatch.group_name ? ` · Grupo ${selectedMatch.group_name}` : ""}
                <span className="ml-1">· {formatDate(selectedMatch.kickoff_at)}</span>
              </p>
              <p className="mb-3 text-center text-sm text-zinc-400">
                {es(selectedMatch.home_team)} vs {es(selectedMatch.away_team)}
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <label className="mb-1 block text-xs text-zinc-500">
                    {es(selectedMatch.home_team)}
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
                    {es(selectedMatch.away_team)}
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
              ¡Resultado guardado y puntuado! {scoredCount} pronóstico{scoredCount !== 1 ? "s" : ""} afectado{scoredCount !== 1 ? "s" : ""}.
            </p>
            {pendingCount > 0 && (
              <p className="mt-1 text-xs text-zinc-500">
                {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""} — el select ya avanzó al próximo
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
