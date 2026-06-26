"use client";

import Bracket from "./Bracket";

type Match = {
  id: number;
  home_team: string;
  away_team: string;
  round_name: string;
  group_name: string | null;
  kickoff_at: string;
  home_score: number | null;
  away_score: number | null;
};

type Prediction = {
  id: number;
  home_score: number;
  away_score: number;
  points: number | null;
} | null;

/**
 * Thin wrapper that renders the knockout bracket.
 * Exists as a separate component to isolate bracket imports from the page.
 */
export default function TournamentBracket({
  matchesByRound,
  predictions,
  userId,
}: {
  matchesByRound: Record<string, Match[]>;
  predictions: Map<number, Prediction>;
  userId: string;
}) {
  return (
    <Bracket
      matchesByRound={matchesByRound}
      predictions={predictions}
      userId={userId}
    />
  );
}
