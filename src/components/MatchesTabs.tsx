"use client";

import { useState } from "react";

export default function MatchesTabs({
  posicionesNode,
  tercerosNode,
  goleadoresNode,
  gruposNode,
  eliminatoriasNode,
  hasStandings,
}: {
  posicionesNode: React.ReactNode;
  tercerosNode: React.ReactNode;
  goleadoresNode: React.ReactNode;
  gruposNode: React.ReactNode;
  eliminatoriasNode: React.ReactNode;
  hasStandings: boolean;
}) {
  const [activeView, setActiveView] = useState<
    "posiciones" | "terceros" | "goleadores" | "grupos" | "eliminatorias" | null
  >(null);

  const cards = [
    { id: "grupos", label: "Fase de Grupos", icon: "🏆", desc: "Todos los partidos de la primera fase" },
    { id: "eliminatorias", label: "Eliminatorias", icon: "⚔️", desc: "El cuadro final, desde 16vos hasta la final" },
    ...(hasStandings ? [{ id: "posiciones", label: "Posiciones", icon: "📊", desc: "Tablas de todos los grupos" }] : []),
    ...(hasStandings ? [{ id: "terceros", label: "Mejores 3ros", icon: "🥉", desc: "Clasificación de los mejores terceros" }] : []),
    { id: "goleadores", label: "Goleadores", icon: "⚽", desc: "Los máximos artilleros del torneo" },
  ] as const;

  if (activeView) {
    const currentCard = cards.find((c) => c.id === activeView);
    return (
      <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={() => setActiveView(null)}
          className="flex w-fit items-center gap-2 rounded-lg bg-zinc-800/50 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Volver
        </button>

        <div className="flex items-center gap-3 px-2">
          <span className="text-3xl">{currentCard?.icon}</span>
          <h2 className="text-2xl font-bold text-white">{currentCard?.label}</h2>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#1a1a24] p-5 shadow-lg">
          {activeView === "posiciones" && posicionesNode}
          {activeView === "terceros" && tercerosNode}
          {activeView === "goleadores" && goleadoresNode}
          {activeView === "grupos" && gruposNode}
          {activeView === "eliminatorias" && eliminatoriasNode}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in zoom-in-95 duration-300">
      {cards.map((card) => (
        <button
          key={card.id}
          onClick={() => setActiveView(card.id as typeof activeView)}
          className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-[#1a1a24] p-8 text-center transition-all hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-800/50 hover:shadow-xl hover:shadow-blue-900/10 active:scale-95"
        >
          <span className="text-5xl transition-transform duration-300 group-hover:scale-110">
            {card.icon}
          </span>
          <div>
            <h3 className="text-lg font-bold text-white">{card.label}</h3>
            <p className="mt-1 text-xs text-zinc-500">{card.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
