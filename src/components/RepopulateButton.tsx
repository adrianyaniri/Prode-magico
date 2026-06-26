"use client";

import { useRouter } from "next/navigation";

export default function RepopulateButton() {
  const router = useRouter();

  return (
    <form
      action="/api/repopulate"
      method="POST"
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          !window.confirm(
            "¿Estás seguro? Esto borrará todos los partidos actuales y los reemplazará con los datos de la API."
          )
        )
          return;
        const btn = e.currentTarget.querySelector("button");
        if (btn) {
          btn.disabled = true;
          btn.textContent = "Repoblando…";
        }
        try {
          const res = await fetch("/api/repopulate", { method: "POST" });
          const data = await res.json();
          window.alert(
            data.success
              ? `✔ Hecho: ${data.matchesInserted} partidos, ${data.standingsSaved} posiciones`
              : `✖ Error: ${data.error}`
          );
        } catch {
          window.alert("Error de red");
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.textContent = "Repoblar Ahora";
          }
          router.refresh();
        }
      }}
    >
      <button
        type="submit"
        className="flex h-10 w-full items-center justify-center rounded-lg bg-amber-700 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
      >
        Repoblar Ahora
      </button>
    </form>
  );
}
