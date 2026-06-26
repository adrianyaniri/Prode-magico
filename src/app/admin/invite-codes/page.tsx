"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import QRCode from "react-qr-code";

type InviteCode = {
  id: number;
  code: string;
  max_uses: number;
  uses_count: number;
  created_at: string;
};

export default function InviteCodesPage() {
  const supabase = createClient();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMaxUses, setNewMaxUses] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  async function fetchCodes() {
    const { data } = await supabase
      .from("invite_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setCodes(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchCodes();
  }, []);

  async function generateCode() {
    setError(null);
    setSuccess(false);

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const res = await fetch("/api/admin/invite-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, maxUses: parseInt(newMaxUses, 10) }),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error || "Failed to create code");
      return;
    }

    setSuccess(true);
    await fetchCodes();
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-white">Códigos de Invitación</h1>
        <p className="text-sm text-zinc-500">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-white">Códigos de Invitación</h1>

      {/* Create new code */}
      <div className="rounded-xl border border-zinc-800 bg-[#1a1a24] p-4">
        <h2 className="mb-3 text-sm font-medium text-white">
          Generar Nuevo Código
        </h2>
        <div className="flex items-center gap-3">
          <label className="text-xs text-zinc-500">Usos máx.:</label>
          <input
            type="number"
            min="1"
            max="100"
            value={newMaxUses}
            onChange={(e) => setNewMaxUses(e.target.value)}
            className="w-20 rounded-lg border border-zinc-700 bg-[#111118] px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
          />
          <button
            onClick={generateCode}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#111118] transition-opacity hover:opacity-90"
          >
            Generar
          </button>
        </div>
        {error && (
          <p className="mt-2 text-xs text-red-400">{error}</p>
        )}
        {success && (
          <p className="mt-2 text-xs text-green-400">
            ¡Código creado exitosamente!
          </p>
        )}
      </div>

      {/* Existing codes */}
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                Code
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium uppercase text-zinc-500">
                Used
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium uppercase text-zinc-500">
                Max
              </th>
              <th className="hidden px-3 py-3 text-right text-xs font-medium uppercase text-zinc-500 sm:table-cell">
                Created
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium uppercase text-zinc-500">
                QR
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {codes.map((code) => (
              <tr key={code.id} className="hover:bg-zinc-800/30">
                <td className="px-3 py-3 font-mono text-sm text-white">
                  {code.code}
                </td>
                <td className="px-3 py-3 text-right font-mono text-sm text-zinc-400">
                  {code.uses_count}
                </td>
                <td className="px-3 py-3 text-right font-mono text-sm text-zinc-400">
                  {code.max_uses}
                </td>
                <td className="hidden px-3 py-3 text-right text-xs text-zinc-600 sm:table-cell">
                  {new Date(code.created_at).toLocaleDateString()}
                </td>
                <td className="px-3 py-3 text-right">
                  <button 
                    onClick={() => setSelectedCode(code.code)}
                    className="rounded bg-blue-600/20 px-2 py-1 text-xs font-bold text-blue-400 hover:bg-blue-600/40"
                  >
                    QR
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setSelectedCode(null)}>
          <div className="rounded-2xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-xl font-bold text-black">Escaneá para sumarte</h3>
            <div className="mx-auto rounded-xl border-4 border-black p-4 inline-block bg-white">
              <QRCode 
                value={`${window.location.origin}/auth/sign-in?invite=${selectedCode}`} 
                size={256} 
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
            <p className="mt-4 font-mono text-2xl font-black tracking-widest text-blue-600">{selectedCode}</p>
            <p className="mt-1 text-xs text-zinc-500">El código ya está incluido en el QR</p>
            <button 
              className="mt-6 w-full rounded-xl bg-zinc-200 px-6 py-3 font-bold text-zinc-800 transition-colors hover:bg-zinc-300"
              onClick={() => setSelectedCode(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
