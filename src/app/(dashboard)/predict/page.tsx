import { createClient } from "@/lib/supabase/server";
import MatchCard from "@/components/MatchCard";
import BonusPredictionsCard from "@/components/BonusPredictionsCard";
import { isBefore, parseISO } from "date-fns";
import Link from "next/link";

const KNOCKOUT_ROUNDS = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Third Place",
  "Final",
];

export default async function PredictPage() {
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

  const predictionsMap = new Map(
    predictionsData?.map((p) => [p.match_id, p]) ?? [],
  );

  const allMatches = matches ?? [];
  const now = new Date();

  // Only keep matches that haven't started yet and are not group stage (or are group stage if we want)
  // The user says the group stage is past anyway, so we just filter by isBefore.
  const upcomingMatches = allMatches.filter((m) => {
    const kickoff = parseISO(m.kickoff_at);
    return !isBefore(kickoff, now) && m.round_name !== "Group Stage";
  });

  const knockoutStarted = allMatches.some((m) => {
    return m.round_name !== "Group Stage" && isBefore(parseISO(m.kickoff_at), now);
  });

  const uniqueTeams = Array.from(
    new Set(allMatches.flatMap((m) => [m.home_team, m.away_team]))
  ).filter((team) => team && team !== "TBD");

  // Group by round name
  const matchesByRound: Record<string, typeof allMatches> = {};
  for (const match of upcomingMatches) {
    const round = match.round_name;
    if (!matchesByRound[round]) matchesByRound[round] = [];
    matchesByRound[round].push(match);
  }

  const hasMatches = Object.keys(matchesByRound).length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Jugar</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Cargá o modificá tus pronósticos para los próximos partidos.
        </p>
      </div>

      <BonusPredictionsCard 
        userId={user.id} 
        isLocked={knockoutStarted} 
        participatingTeams={uniqueTeams} 
      />

      {!hasMatches && (
        <div className="rounded-xl border border-zinc-800 bg-[#1a1a24] p-8 text-center">
          <h2 className="mb-2 text-lg font-bold text-white">
            No hay partidos disponibles
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            Todos los partidos han comenzado o no hay cruces confirmados aún.
          </p>
          <Link
            href="/matches"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-6 font-medium text-[#111118] transition-opacity hover:opacity-90"
          >
            Ver Resultados
          </Link>
        </div>
      )}

      {KNOCKOUT_ROUNDS.map((round) => {
        const matches = matchesByRound[round];
        if (!matches?.length) return null;
        return (
          <div key={round} className="mb-2">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              {round}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predictionsMap.get(match.id) ?? null}
                  userId={user.id}
                  hidePrediction={false}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
