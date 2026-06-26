"use client";

import { useState } from "react";

type SyncResult = {
  synced: number;
  scored: number;
  errors?: string[];
};

export default function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      setResult({ synced: data.synced ?? 0, scored: data.scored ?? 0 });
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

      {result && (
        <div className="rounded-lg border border-green-800 bg-green-900/20 p-3 text-center">
          <p className="text-sm text-green-400">
            {result.synced} partido{result.synced !== 1 ? "s" : ""} sincronizado{result.synced !== 1 ? "s" : ""},
            {result.scored} pronóstico{result.scored !== 1 ? "s" : ""} puntuado{result.scored !== 1 ? "s" : ""}.
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
