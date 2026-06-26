"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const code = searchParams.get("invite");
    if (code) {
      setInviteCode(code.toUpperCase());
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const safeUsername = username.trim();
    const email = `${safeUsername.toLowerCase().replace(/[^a-z0-9]/g, "")}@prode.com`;
    const password = `${pin}prode2026`;

    try {
      if (inviteCode.trim() !== "") {
        // --- FLUJO DE REGISTRO (PRIMERA VEZ) ---
        // Usamos nuestro endpoint propio que crea el usuario como Administrador por detrás,
        // esto evita cualquier bloqueo por "Rate Limit" de emails falsos.
        const registerRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            username: safeUsername,
            inviteCode: inviteCode.trim().toUpperCase(),
          }),
        });

        if (!registerRes.ok) {
          const err = await registerRes.json();
          throw new Error(err.error || "Ocurrió un error al registrarte.");
        }

        // El usuario ya se creó con éxito. Ahora iniciamos sesión para que le quede la cookie.
        const { error: loginAfterRegError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginAfterRegError) {
          throw new Error("Cuenta creada, pero hubo un error al iniciar sesión. Por favor, borrá el código de invitación e ingresá normalmente.");
        }

        window.location.href = "/predict";
      } else {
        // --- FLUJO DE LOGIN ---
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError("Nombre o PIN incorrectos. Si es tu primera vez, ingresá el código de invitación que te pasaron.");
          setLoading(false);
          return;
        }

        window.location.href = "/predict";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-[#1a1a24] p-6 shadow-2xl shadow-black/50">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Prode <span className="text-blue-500">Mágico</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Ingresá para cargar tus pronósticos.
        </p>
        <p className="mt-1 text-xs font-medium italic text-purple-400">
          ⚠️ Jugar exclusivamente bajo los efectos del fernet.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="username"
            className="mb-1 block text-sm font-medium text-zinc-400"
          >
            Tu Nombre / Apodo
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ej: Matias"
            required
            className="w-full rounded-lg border border-zinc-700 bg-[#111118] px-3 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="pin"
            className="mb-1 block text-sm font-medium text-zinc-400"
          >
            PIN Secreto (4 números)
          </label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Ej: 1234"
            required
            className="w-full rounded-lg border border-zinc-700 bg-[#111118] px-3 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-blue-500"
          />
        </div>

        <div className="rounded-lg border border-dashed border-zinc-700/50 bg-zinc-900/30 p-3">
          <label
            htmlFor="invite-code"
            className="mb-1 block text-xs font-medium text-zinc-400"
          >
            Código de Invitación <span className="text-zinc-500">(Solo si sos nuevo)</span>
          </label>
          <input
            id="invite-code"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="Si ya jugás, dejalo vacío"
            className="w-full rounded-lg border border-zinc-800 bg-[#111118] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-500"
          />
        </div>

        {error && (
          <p
            className="text-center font-medium text-sm text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-lg shadow-blue-900/20 transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Yendo a la gloria…" : "A la gloria eterna"}
        </button>
      </form>
    </div>
  );
}
