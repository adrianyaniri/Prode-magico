import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import SyncButton from "@/components/SyncButton";
import { TEAM_NAMES_ES } from "@/lib/sync/teams-es";
import { esRound } from "@/lib/sync/round-names";

function es(team: string) {
  return TEAM_NAMES_ES[team] ?? team;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminOverview() {
  const supabase = createAdminClient();

  const now = new Date().toISOString();

  const [
    { count: userCount },
    { count: matchCount },
    { count: predictionCount },
    { count: inviteCodeCount },
    { count: scoredPredictions },
    { data: pendingMatches },
    { count: totalWithResults },
    { data: userRoles },
    { data: authData },
  ] = await Promise.all([
    supabase.from("user_roles").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("predictions").select("*", { count: "exact", head: true }),
    supabase.from("invite_codes").select("*", { count: "exact", head: true }),
    supabase
      .from("predictions")
      .select("*", { count: "exact", head: true })
      .not("points", "is", null),
    supabase
      .from("matches")
      .select("id, home_team, away_team, round_name, group_name, kickoff_at")
      .lt("kickoff_at", now)
      .is("home_score", null)
      .order("kickoff_at", { ascending: true }),
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .not("home_score", "is", null),
    supabase
      .from("user_roles")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.auth.admin.listUsers(),
  ]);

  const emailMap = new Map(
    authData?.users?.map((u) => [u.id, u.email ?? ""]) ?? [],
  );

  const users =
    userRoles?.map((ur) => ({
      email: emailMap.get(ur.user_id) ?? "N/A",
      role: ur.role,
      created_at: ur.created_at,
    })) ?? [];

  const pendingCount = pendingMatches?.length ?? 0;
  const pendingCards = pendingMatches?.slice(0, 5) ?? [];

  const statsCards = [
    { label: "Usuarios", value: userCount ?? 0 },
    { label: "Partidos", value: matchCount ?? 0 },
    { label: "Pronósticos", value: predictionCount ?? 0 },
    { label: "Códigos de Invitación", value: inviteCodeCount ?? 0 },
    { label: "Pronósticos Puntuados", value: scoredPredictions ?? 0 },
    { label: "Resultados Cargados", value: totalWithResults ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-white">Panel de Administración</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        {statsCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-zinc-800 bg-[#1a1a24] p-4"
          >
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Pending matches alert */}
      {pendingCount > 0 && (
        <div className="rounded-xl border border-amber-900/40 bg-amber-900/10 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-amber-300">
              {pendingCount} partido{pendingCount !== 1 ? "s" : ""} pendiente{pendingCount !== 1 ? "s" : ""} de resultado
            </h2>
            <Link
              href="/admin/results"
              className="text-xs font-medium text-amber-400 underline underline-offset-2 hover:text-amber-300"
            >
              Cargar resultados
            </Link>
          </div>
          <div className="space-y-1">
            {pendingCards.map((m) => (
              <p key={m.id} className="text-xs text-zinc-400">
                {es(m.home_team)} vs {es(m.away_team)}
                <span className="ml-1 text-zinc-600">
                  ({esRound(m.round_name)}{m.group_name ? ` · Grupo ${m.group_name}` : ""} · {formatDate(m.kickoff_at)})
                </span>
              </p>
            ))}
            {pendingCards.length < pendingCount && (
              <p className="text-xs text-zinc-600">
                y {pendingCount - pendingCards.length} más...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sync Results */}
      <div className="rounded-xl border border-zinc-800 bg-[#1a1a24] p-4">
        <h2 className="mb-3 text-sm font-medium text-white">
          Sincronizar Resultados desde API
        </h2>
        <SyncButton />
      </div>

      {/* Quick links */}
      <div className="flex gap-3">
        <Link
          href="/admin/results"
          className="flex h-10 flex-1 items-center justify-center rounded-lg border border-amber-700 text-sm font-medium text-amber-300 transition-colors hover:border-amber-500"
        >
          {pendingCount > 0 ? `Cargar Resultados (${pendingCount} pendientes)` : "Cargar Resultados"}
        </Link>
        <Link
          href="/matches"
          className="flex h-10 flex-1 items-center justify-center rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500"
        >
          Todos los Partidos
        </Link>
      </div>

      {/* Registered users table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <h2 className="text-sm font-medium text-white">
            Usuarios Registrados ({users.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                  Correo Electrónico
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                  Rol
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-zinc-500">
                  Registrado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-sm text-zinc-600"
                  >
                    No hay usuarios registrados aún
                  </td>
                </tr>
              )}
              {users.map((u, i) => (
                <tr key={i} className="hover:bg-zinc-800/30">
                  <td className="max-w-[200px] truncate px-4 py-3 text-white">
                    {u.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-green-900/30 text-green-400"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-zinc-500">
                    {new Date(u.created_at).toLocaleDateString("es", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
