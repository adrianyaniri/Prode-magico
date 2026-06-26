"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function InstallPageContent() {
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite") ?? "";

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Detect if already installed as PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (isStandalone) setIsInstalled(true);

    // Capture the install prompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setInstalling(false);
    setDeferredPrompt(null);
  }

  function goToRegister() {
    const url = invite
      ? `/auth/sign-in?invite=${invite}`
      : "/auth/sign-in";
    window.location.href = url;
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#111118] px-6 py-12">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/50 to-transparent" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8 text-center">

        {/* Icon */}
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600 to-purple-700 shadow-2xl shadow-blue-900/50 text-5xl">
          ⚽
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-black text-white">Prode Mágico</h1>
          <p className="mt-2 text-base text-zinc-400">Mundial 2026 🏆</p>
        </div>

        {/* Content based on state */}
        {isInstalled ? (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-4xl">
              ✅
            </div>
            <p className="text-lg font-bold text-white">¡App instalada!</p>
            <p className="text-sm text-zinc-400">Ya la tenés en tu pantalla de inicio.</p>
            <button
              onClick={goToRegister}
              className="mt-2 w-full rounded-2xl bg-blue-600 px-6 py-4 text-lg font-black text-white shadow-lg shadow-blue-900/40 transition-all active:scale-95"
            >
              Crear mi cuenta →
            </button>
          </div>
        ) : isIOS ? (
          <div className="w-full flex flex-col gap-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
              <p className="mb-4 text-center text-sm font-bold text-white">Para instalar en iPhone:</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">1</span>
                  <p className="text-sm text-zinc-300">Tocá el botón <strong className="text-white">Compartir</strong> <span className="text-base">⬆️</span> abajo en Safari</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">2</span>
                  <p className="text-sm text-zinc-300">Elegí <strong className="text-white">"Agregar a la pantalla de inicio"</strong></p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">3</span>
                  <p className="text-sm text-zinc-300">Tocá <strong className="text-white">Agregar</strong> arriba a la derecha</p>
                </div>
              </div>
            </div>
            <button
              onClick={goToRegister}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-6 py-4 text-base font-bold text-white transition-all active:scale-95"
            >
              Ya instalé, ir a registrarme →
            </button>
          </div>
        ) : deferredPrompt ? (
          <div className="w-full flex flex-col items-center gap-4">
            <p className="text-sm text-zinc-400">
              Instalá la app en tu celu para tener acceso rápido sin abrir el navegador.
            </p>
            <button
              onClick={handleInstall}
              disabled={installing}
              className="w-full rounded-2xl bg-blue-600 px-6 py-5 text-xl font-black text-white shadow-xl shadow-blue-900/50 transition-all active:scale-95 disabled:opacity-70"
            >
              {installing ? "Instalando…" : "📲 Instalar App"}
            </button>
            <button
              onClick={goToRegister}
              className="text-sm text-zinc-500 underline underline-offset-4"
            >
              Saltear e ir directo al registro
            </button>
          </div>
        ) : (
          // Fallback: browser doesn't support beforeinstallprompt yet (maybe already dismissed)
          <div className="w-full flex flex-col items-center gap-4">
            <p className="text-sm text-zinc-400">
              Abrí el menú de tu navegador y tocá <strong className="text-white">"Agregar a la pantalla de inicio"</strong> para instalar la app.
            </p>
            <button
              onClick={goToRegister}
              className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-lg font-black text-white shadow-lg shadow-blue-900/40 transition-all active:scale-95"
            >
              Ir a registrarme →
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-zinc-600">
          App hecha por el genio mundial del Mago ✨
        </p>
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
