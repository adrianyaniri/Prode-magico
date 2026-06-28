"use client";

import { useEffect, useState } from "react";
import { parseISO, differenceInSeconds } from "date-fns";

export default function CountdownBanner({ targetDateStr }: { targetDateStr: string }) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const target = parseISO(targetDateStr);
    
    const update = () => {
      const diff = differenceInSeconds(target, new Date());
      setTimeLeft(diff > 0 ? diff : 0);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr]);

  if (timeLeft === null || timeLeft <= 0) return null;

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  // Solo mostrar si faltan menos de 24 horas
  if (hours >= 24) return null;

  return (
    <div className="mb-4 rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 shadow-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⏳</span>
        <div>
          <h3 className="font-bold text-orange-400 text-sm">¡Apurate, colgado!</h3>
          <p className="text-xs text-orange-400/80">Falta re poco para el próximo partido.</p>
        </div>
      </div>
      <div className="text-right font-mono font-black text-orange-400 bg-orange-950/50 px-3 py-1.5 rounded-lg border border-orange-500/20">
        {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </div>
    </div>
  );
}
