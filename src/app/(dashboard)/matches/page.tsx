import { createClient } from "@/lib/supabase/server";
import TournamentBracket from "@/components/TournamentBracket";
import { TEAM_NAMES_ES } from "@/lib/sync/teams-es";
import { TEAM_CRESTS } from "@/lib/sync/teams-crests";
import { GroupStandingsGrid } from "@/components/GroupStandings";
import TopScorersTable from "@/components/TopScorersTable";
import BestThirdsTable from "@/components/BestThirdsTable";
import MatchCard from "@/components/MatchCard";
import MatchesTabs from "@/components/MatchesTabs";

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

function displayTeam(team: string | null, align: "left" | "right" = "left"): React.ReactNode {
  if (!team || team === "TBD") return "?";
  const cleaned = team.replace(/^W/, "");
  if (/^\d+$/.test(cleaned)) return "?";
  const crest = TEAM_CRESTS[team];
  const name = es(team);
  
  if (!crest) return name;
  
  if (align === "left") {
    return (
      <span className="flex items-center gap-2">
        <img src={crest} alt="" className="h-4 w-4 object-contain" />
        <span className="truncate">{name}</span>
      </span>
    );
  } else {
    return (
      <span className="flex items-center justify-end gap-2">
        <span className="truncate">{name}</span>
        <img src={crest} alt="" className="h-4 w-4 object-contain" />
      </span>
    );
  }
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
    // DB stores 'Group A', components expect just 'A'
    const key = s.group_name.replace(/^Group\s+/i, "");
    if (!standingsByGroup[key]) standingsByGroup[key] = [];
    standingsByGroup[key].push(s);
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

      <MatchesTabs
        hasStandings={hasStandings}
        posicionesNode={<GroupStandingsGrid standingsByGroup={standingsByGroup} />}
        tercerosNode={<BestThirdsTable />}
        goleadoresNode={<TopScorersTable />}
        gruposNode={
          <>
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
                          <span className="w-28 text-white">
                            {displayTeam(match.home_team, "left")}
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
                          <span className="w-28 text-white">
                            {displayTeam(match.away_team, "right")}
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
          </>
        }
        eliminatoriasNode={
          hasKnockout ? (
            <TournamentBracket
              matchesByRound={knockoutByRound}
              predictions={predictionsMap}
              userId={user.id}
            />
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-[#1a1a24] p-6 text-center text-sm text-zinc-500">
              Aún no hay cruces de eliminatorias
            </div>
          )
        }
      />
    </div>
  );
}
