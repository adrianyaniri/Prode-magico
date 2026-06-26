"use client";

import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<Event | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;

    const promptEvent = deferredPrompt as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2">
      <div className="rounded-xl border border-zinc-700 bg-[#1a1a24] p-4 shadow-lg">
        <p className="mb-2 text-sm text-white">
          Install Prode WC2026 for a better experience!
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 rounded-lg bg-white px-3 py-2 text-xs font-medium text-[#111118]"
          >
            Install
          </button>
          <button
            onClick={() => setShowPrompt(false)}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
