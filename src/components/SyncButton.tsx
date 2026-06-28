"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SyncResult = {
  synced: number;
  scored: number;
  standingsSynced?: number;
  errors?: string[];
  apiInfo?: {
    count?: number;
    competition?: string | null;
    season?: string | null;
    firstMatch?: { home?: string; away?: string; stage?: string; group?: string | null; status?: string; date?: string } | null;
    sampleDbKeys?: string[];
    sampleApiKeys?: string[];
    matchStats?: { total: number; byApiId: number; byPrimary: number; byReverse: number; notFound: number; scoreChanged: number };
  } | null;
};

type LastSyncInfo = {
  timestamp: string;
  synced: number;
  scored: number;
};

const STORAGE_KEY = "lastSync";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<LastSyncInfo | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setLastSync(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  async function handleSync() {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/sync-results", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Sincronización fallida");
        return;
      }

      const syncInfo: LastSyncInfo = {
        timestamp: new Date().toISOString(),
        synced: data.synced ?? 0,
        scored: data.scored ?? 0,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(syncInfo));
      setLastSync(syncInfo);
      setResult({ synced: data.synced ?? 0, scored: data.scored ?? 0, standingsSynced: data.standingsSynced ?? 0, errors: data.errors, apiInfo: data.apiInfo });
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-green-600 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Sincronizando…
          </span>
        ) : (
          "Sincronizar Ahora"
        )}
      </button>

      {lastSync && !result && (
        <p className="text-center text-xs text-zinc-500">
          Última sincronización: {formatTime(lastSync.timestamp)}
          <span className="ml-1">
            ({lastSync.synced} partido{lastSync.synced !== 1 ? "s" : ""}, {lastSync.scored} pronóstico{lastSync.scored !== 1 ? "s" : ""})
          </span>
        </p>
      )}

      {result && (
        <div className="rounded-lg border border-green-800 bg-green-900/20 p-3 text-center">
          <p className="text-sm text-green-400">
            {result.synced > 0 || result.scored > 0 ? (
              <>
                {result.synced} partido{result.synced !== 1 ? "s" : ""} sincronizado{result.synced !== 1 ? "s" : ""},
                {result.scored} pronóstico{result.scored !== 1 ? "s" : ""} puntuado{result.scored !== 1 ? "s" : ""}.
              </>
            ) : (
              "Sin cambios en resultados."
            )}
            {result.standingsSynced !== undefined && (
              <span> Tabla: {result.standingsSynced} filas.</span>
            )}
          </p>
          {result.errors && result.errors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-zinc-500">
                {result.errors.length} error{result.errors.length !== 1 ? "es" : ""}
              </summary>
              <ul className="mt-1 space-y-1 text-left">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-red-400">
                    {e}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {result.apiInfo && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-zinc-500">
                API: {result.apiInfo.count ?? "?"} partidos · {result.apiInfo.competition ?? "?"}
              </summary>
              <div className="mt-1 text-left text-xs text-zinc-400">
                <p>Comp: {result.apiInfo.competition ?? "?"}</p>
                <p>Season: {result.apiInfo.season ?? "?"}</p>
                <p>Partidos: {result.apiInfo.count ?? "?"}</p>
                {result.apiInfo.firstMatch && (
                  <>
                    <p>1er match: {result.apiInfo.firstMatch.home} vs {result.apiInfo.firstMatch.away} ({result.apiInfo.firstMatch.stage})</p>
                    <p>Group: {result.apiInfo.firstMatch.group ?? "(null)"}</p>
                  </>
                )}
                {result.apiInfo.sampleDbKeys && result.apiInfo.sampleDbKeys.length > 0 && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-zinc-500">DB Group A keys ({result.apiInfo.sampleDbKeys.length})</summary>
                    <ul className="ml-2">
                      {result.apiInfo.sampleDbKeys.map((k, i) => <li key={i}>{k}</li>)}
                    </ul>
                  </details>
                )}
                {result.apiInfo.sampleApiKeys && result.apiInfo.sampleApiKeys.length > 0 && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-zinc-500">API Group A keys ({result.apiInfo.sampleApiKeys.length})</summary>
                    <ul className="ml-2">
                      {result.apiInfo.sampleApiKeys.map((k, i) => <li key={i}>{k}</li>)}
                    </ul>
                  </details>
                )}
                {result.apiInfo.matchStats && (
                  <p className="mt-1">Match Stats: {result.apiInfo.matchStats.total} total, {result.apiInfo.matchStats.byApiId} api_id, {result.apiInfo.matchStats.byPrimary} primary, {result.apiInfo.matchStats.byReverse} reverse, {result.apiInfo.matchStats.notFound} not found, {result.apiInfo.matchStats.scoreChanged} score changed</p>
                )}
              </div>
            </details>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
