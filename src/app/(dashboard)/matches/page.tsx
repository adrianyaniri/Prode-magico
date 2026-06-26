import { createClient } from "@/lib/supabase/server";
import TournamentBracket from "@/components/TournamentBracket";
import { TEAM_NAMES_ES } from "@/lib/sync/teams-es";
import { GroupStandingsGrid } from "@/components/GroupStandings";
import TopScorersTable from "@/components/TopScorersTable";
import BestThirdsTable from "@/components/BestThirdsTable";
import MatchCard from "@/components/MatchCard";

const KNOCKOUT_ROUNDS = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Third Place",
  "Final",
];

type StandingRow = {
  id: number;
  group_name: string;
  position: number;
  team: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
};

const GROUP_LABELS = [
  "A", "B", "C", "D", "E", "F",
  "G", "H", "I", "J", "K", "L",
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es", {
    month: "short",
    day: "numeric",
  });
}

function es(team: string | null): string {
  if (!team) return "?";
  return TEAM_NAMES_ES[team] ?? team;
}

function displayTeam(team: string | null): string {
  if (!team || team === "TBD") return "?";
  const cleaned = team.replace(/^W/, "");
  if (/^\d+$/.test(cleaned)) return "?";
  return es(team);
}

// ── Collapsible Section ──────────────────────────────────────────────────

function Section({
  num,
  title,
  defaultOpen = true,
  children,
}: {
  num: number;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-xl border border-zinc-800 bg-[#1a1a24] transition-colors"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800/20 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-300">
            {num}
          </span>
          {title}
        </span>
        <svg
          className="h-4 w-4 text-zinc-500 transition-transform group-open:rotate-180"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </summary>
      <div className="border-t border-zinc-800 px-5 py-4">{children}</div>
    </details>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function MatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch matches
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true });

  // Fetch predictions
  const { data: predictionsData } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user.id);

  // Fetch group standings
  const { data: standings } = await supabase
    .from("group_standings")
    .select("*")
    .order("position", { ascending: true });

  const predictionsMap = new Map(
    predictionsData?.map((p) => [p.match_id, p]) ?? [],
  );

  // Build standings by group
  const standingsData = (standings ?? []) as StandingRow[];
  const standingsByGroup: Record<string, StandingRow[]> = {};
  for (const s of standingsData) {
    if (!standingsByGroup[s.group_name]) standingsByGroup[s.group_name] = [];
    standingsByGroup[s.group_name].push(s);
  }

  const allMatches = matches ?? [];

  const groupMatches = allMatches.filter(
    (m) => m.round_name === "Group Stage",
  );
  const knockoutMatches = allMatches.filter(
    (m) => m.round_name !== "Group Stage",
  );

  // Group matches by group_name
  const groups: Record<string, typeof allMatches> = {};
  for (const match of groupMatches) {
    const g = match.group_name;
    if (!g) continue;
    if (!groups[g]) groups[g] = [];
    groups[g].push(match);
  }

  // Group knockout matches by round name
  const knockoutByRound: Record<string, typeof allMatches> = {};
  for (const match of knockoutMatches) {
    const round = match.round_name;
    if (!knockoutByRound[round]) knockoutByRound[round] = [];
    knockoutByRound[round].push(match);
  }

  const hasKnockout = Object.keys(knockoutByRound).length > 0;
  const hasStandings = Object.keys(standingsByGroup).length > 0;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-white">Partidos</h1>

      {/* ── 1. Tabla de Posiciones ── */}
      {hasStandings && (
        <Section num={1} title="Tabla de Posiciones">
          <GroupStandingsGrid standingsByGroup={standingsByGroup} />
        </Section>
      )}

      {/* ── 2. Tabla de Mejores Terceros ── */}
      {hasStandings && (
        <Section num={2} title="Mejores Terceros (Clasifican 8)" defaultOpen={false}>
          <BestThirdsTable />
        </Section>
      )}

      {/* ── 3. Goleadores del Torneo ── */}
      <Section num={3} title="Goleadores del Torneo" defaultOpen={false}>
        <TopScorersTable />
      </Section>

      {/* ── 4. Partidos de Grupo ── */}
      <Section num={4} title="Partidos de Grupo">
        {GROUP_LABELS.map((label) => {
          const mg = groups[label];
          if (!mg?.length) return null;

          return (
            <div key={label} className="mb-4 last:mb-0">
              <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#1a1a24]">
                <div className="border-b border-zinc-800 px-4 py-2.5">
                  <h3 className="text-sm font-bold text-white">
                    Grupo {label}
                  </h3>
                </div>
                <div className="divide-y divide-zinc-800/50">
                  {mg.map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-zinc-800/20"
                    >
                      <span className="w-28 truncate text-white">
                        {displayTeam(match.home_team)}
                      </span>
                      <div className="flex w-16 shrink-0 items-center justify-center gap-1 font-mono">
                        {match.home_score !== null ? (
                          <>
                            <span className="font-bold text-white">
                              {match.home_score}
                            </span>
                            <span className="text-zinc-500">–</span>
                            <span className="font-bold text-white">
                              {match.away_score}
                            </span>
                          </>
                        ) : (
                          <span className="text-zinc-500">vs</span>
                        )}
                      </div>
                      <span className="w-28 truncate text-right text-white">
                        {displayTeam(match.away_team)}
                      </span>
                      <span className="ml-auto shrink-0 text-xs text-zinc-500">
                        {formatDate(match.kickoff_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {GROUP_LABELS.every((l) => !groups[l]?.length) && (
          <p className="text-sm text-zinc-500">
            No hay partidos de grupo disponibles
          </p>
        )}
      </Section>

      {/* ── 5. Cuadro de Eliminatorias ── */}
      <Section num={5} title="Cuadro de Eliminatorias">
        {hasKnockout ? (
          <TournamentBracket
            matchesByRound={knockoutByRound}
            predictions={predictionsMap}
            userId={user.id}
          />
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-[#1a1a24] p-6 text-center text-sm text-zinc-500">
            Aún no hay cruces de eliminatorias
          </div>
        )}
      </Section>
    </div>
  );
}
