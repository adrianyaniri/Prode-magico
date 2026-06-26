"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function InstallPageContent() {
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite") ?? "";

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [step, setStep] = useState<"install" | "done">("install");

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (standalone) setStep("done");

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") setStep("done");
  }

  function goToRegister() {
    window.location.href = invite ? `/auth/sign-in?invite=${invite}` : "/auth/sign-in";
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#111118] px-6 py-12">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600 to-purple-700 shadow-2xl shadow-blue-900/50 text-5xl">
          ⚽
        </div>

        <div>
          <h1 className="text-3xl font-black text-white">Prode Mágico</h1>
          <p className="mt-1 text-zinc-400">Mundial 2026 🏆</p>
        </div>

        {step === "done" ? (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="text-5xl">🎉</div>
            <p className="text-xl font-black text-white">¡App instalada!</p>
            <p className="text-sm text-zinc-400">Ahora creá tu cuenta para empezar a jugar.</p>
            <button
              onClick={goToRegister}
              className="w-full rounded-2xl bg-blue-600 px-6 py-5 text-xl font-black text-white shadow-xl shadow-blue-900/50 transition-all active:scale-95"
            >
              Crear mi cuenta →
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-4">
            {/* One-tap install button — only shows if browser supports it */}
            {deferredPrompt && (
              <button
                onClick={handleInstall}
                className="w-full rounded-2xl bg-blue-600 px-6 py-5 text-xl font-black text-white shadow-xl shadow-blue-900/50 transition-all active:scale-95"
              >
                📲 Instalar App
              </button>
            )}

            {/* Manual instructions — always visible */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
              <p className="mb-4 text-center text-sm font-bold text-white">
                {isIOS ? "Cómo instalar en iPhone:" : "Cómo instalar en Android:"}
              </p>
              {isIOS ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">1</span>
                    <p className="text-sm text-zinc-300">Tocá el ícono de <strong className="text-white">Compartir ⬆️</strong> en la barra de Safari</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">2</span>
                    <p className="text-sm text-zinc-300">Elegí <strong className="text-white">"Agregar a la pantalla de inicio"</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">3</span>
                    <p className="text-sm text-zinc-300">Tocá <strong className="text-white">Agregar</strong> arriba a la derecha</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">1</span>
                    <p className="text-sm text-zinc-300">Tocá los <strong className="text-white">3 puntitos ⋮</strong> arriba a la derecha en Chrome</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">2</span>
                    <p className="text-sm text-zinc-300">Elegí <strong className="text-white">"Agregar a la pantalla de inicio"</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">3</span>
                    <p className="text-sm text-zinc-300">Tocá <strong className="text-white">Instalar</strong> o <strong className="text-white">Agregar</strong></p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setStep("done")}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-6 py-4 text-base font-bold text-white transition-all active:scale-95"
            >
              Ya instalé → Crear mi cuenta
            </button>
          </div>
        )}

        <p className="text-xs text-zinc-600">App hecha por el genio mundial del Mago ✨</p>
      </div>
    </div>
  );
}

export default function InstallPage() {
  return (
    <Suspense>
      <InstallPageContent />
    </Suspense>
  );
}
