import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import SyncButton from "@/components/SyncButton";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Not logged in → landing page ──────────────────────────
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#111118] px-4 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/stadium-bg.jpg")' }}>
        <div className="absolute inset-0 bg-[#111118]/80 backdrop-blur-sm" />
        <div className="relative z-10 flex max-w-sm flex-col items-center gap-8 text-center">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
              Prode <span className="text-blue-500">Mágico</span>
            </h1>
            <p className="mt-3 text-lg font-medium text-zinc-300 drop-shadow-md">
              Copa Mundial 2026
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 mt-4">
            <Link
              href="/auth/sign-in"
              className="flex h-14 w-full items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white transition-colors hover:bg-blue-500 shadow-lg shadow-blue-900/20"
            >
              Jugar
            </Link>
          </div>
        </div>

        {/* Fake Advertisement - Minimalist */}
        <div className="relative z-10 mt-20 flex flex-col gap-6 text-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Sponsor Oficial
            </p>
            <div className="mt-1 flex items-center justify-center gap-2 text-xs">
              <span className="font-semibold text-zinc-400">
                Despensa Quique
              </span>
              <span className="text-zinc-600">•</span>
              <span className="italic text-zinc-500">
                Fiambre cortado grueso y el fernet más frío
              </span>
            </div>
          </div>

          <div className="text-[10px] uppercase tracking-wider text-zinc-600">
            App hecha por el genio mundial del <span className="font-bold text-blue-400">Mago</span> 🪄
          </div>
        </div>
      </div>
    );
  }

  // ── Logged in → check role ────────────────────────────────
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const isAdmin = roleData?.role === "admin";

  // ── ADMIN DASHBOARD ───────────────────────────────────────
  if (isAdmin) {
    const [
      { count: userCount },
      { count: codesCount },
      { count: playedMatches },
      { count: predictionsCount },
    ] = await Promise.all([
      supabase.from("user_roles").select("*", { count: "exact", head: true }),
      supabase.from("invite_codes").select("*", { count: "exact", head: true }),
      supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .not("home_score", "is", null),
      supabase.from("predictions").select("*", { count: "exact", head: true }),
    ]);

    const adminCards = [
      { label: "Usuarios registrados", value: userCount ?? 0 },
      { label: "Códigos activos", value: codesCount ?? 0 },
      { label: "Partidos jugados", value: playedMatches ?? 0 },
      { label: "Pronósticos hechos", value: predictionsCount ?? 0 },
    ];

    return (
      <div className="flex min-h-screen flex-col items-center bg-[#111118] px-4 py-8">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div>
            <h1 className="text-xl font-bold text-white">Panel de Administración</h1>
            <p className="mt-1 text-sm text-zinc-500">Panel de administración</p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3">
            {adminCards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-zinc-800 bg-[#1a1a24] p-4"
              >
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="mt-1 text-xs text-zinc-500">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Sync results */}
          <div className="rounded-xl border border-zinc-800 bg-[#1a1a24] p-4">
            <h2 className="mb-3 text-sm font-medium text-white">
              Sincronizar Resultados
            </h2>
            <SyncButton />
          </div>

          {/* Quick links */}
          <div className="flex flex-col gap-2">
            <Link
              href="/admin"
              className="flex h-11 items-center justify-center rounded-lg bg-white font-medium text-[#111118] transition-opacity hover:opacity-90"
            >
              Panel Admin
            </Link>
            <Link
              href="/admin/invite-codes"
              className="flex h-11 items-center justify-center rounded-lg border border-zinc-700 font-medium text-zinc-300 transition-colors hover:border-zinc-500"
            >
              Códigos de Invitación
            </Link>
            <Link
              href="/matches"
              className="flex h-11 items-center justify-center rounded-lg border border-zinc-700 font-medium text-zinc-300 transition-colors hover:border-zinc-500"
            >
              Todos los Partidos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── PARTICIPANT DASHBOARD ────────────────────────────────
  const adminSupabase = createAdminClient();

  const [
    { count: predictionsCount },
    { data: pointsData },
    { data: allScores },
  ] = await Promise.all([
    supabase
      .from("predictions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("predictions")
      .select("points")
      .eq("user_id", user.id)
      .not("points", "is", null),
    adminSupabase
      .from("predictions")
      .select("user_id, points")
      .not("points", "is", null),
  ]);

  const totalPoints =
    pointsData?.reduce((sum, p) => sum + (p.points ?? 0), 0) ?? 0;

  // Leaderboard position
  const userTotals = new Map<string, number>();
  for (const s of allScores ?? []) {
    const current = userTotals.get(s.user_id) ?? 0;
    userTotals.set(s.user_id, current + (s.points ?? 0));
  }
  const sortedUsers = [...userTotals.entries()].sort(
    (a, b) => b[1] - a[1],
  );
  const position =
    sortedUsers.findIndex(([uid]) => uid === user.id) + 1;
  const totalPlayers = sortedUsers.length;

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#111118] px-4 py-8">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-white">
            Prode WC2026
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {position > 0
              ? `#${position} de ${totalPlayers} en la tabla`
              : "Sigue pronosticando para aparecer en el leaderboard"}
          </p>
        </div>

        {/* Player stats cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-[#1a1a24] p-4">
            <p className="text-2xl font-bold text-white">
              {predictionsCount ?? 0}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Pronósticos
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-[#1a1a24] p-4">
            <p className="text-2xl font-bold text-white">{totalPoints}</p>
            <p className="mt-1 text-xs text-zinc-500">Puntos</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-[#1a1a24] p-4">
            <p className="text-2xl font-bold text-white">
              {position > 0 ? `#${position}` : "—"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">Posición</p>
          </div>
        </div>

        {/* Quick links */}
        <div className="flex flex-col gap-3">
          <Link
            href="/predict"
            className="flex h-14 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white transition-colors hover:bg-blue-500 shadow-lg shadow-blue-900/20"
          >
            ¡Cargar Pronósticos!
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/matches"
              className="flex h-11 items-center justify-center rounded-lg bg-white font-medium text-[#111118] transition-opacity hover:opacity-90"
            >
              Ver Partidos
            </Link>
            <Link
              href="/leaderboard"
              className="flex h-11 items-center justify-center rounded-lg border border-zinc-700 font-medium text-zinc-300 transition-colors hover:border-zinc-500"
            >
              Ver Tabla
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
