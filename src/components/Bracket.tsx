"use client";

import { isBefore, parseISO } from "date-fns";
import { TEAM_NAMES_ES } from "@/lib/sync/teams-es";
import { TEAM_CRESTS } from "@/lib/sync/teams-crests";
import { esRound } from "@/lib/sync/round-names";

// ── Types ────────────────────────────────────────────────────────────────

type Match = {
  id: number;
  home_team: string | null;
  away_team: string | null;
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

// ── Layout constants ─────────────────────────────────────────────────────

const CARD_H = 44;
const GAP = 12;
const S = CARD_H + GAP; // 56
const ROUND_COL_W = 160;
const CONN_W = 32;
const HEADER_H = 36;
const TOTAL_H = 8 * S + HEADER_H + 8; // 492

const KNOCKOUT_ROUNDS = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
] as const;

const ROUND_LABELS: Record<string, string> = {
  "Round of 32": "16vos",
  "Round of 16": "Octavos",
  "Quarter-finals": "Cuartos",
  "Semi-finals": "Semifinal",
  Final: "Final",
};

// ── Helpers ───────────────────────────────────────────────────────────────

function es(team: string | null): string {
  if (!team) return "?";
  return TEAM_NAMES_ES[team] ?? team;
}

/** Tidy a team name – if it looks like a numeric ID or TBD show "?" */
function displayTeam(team: string | null): string {
  if (!team || team === "TBD") return "?";
  const cleaned = team.replace(/^W/, "");
  if (/^\d+$/.test(cleaned)) return "?";
  return es(team);
}

function teamFlag(team: string | null): string | null {
  if (!team || team === "TBD") return null;
  const cleaned = team.replace(/^W/, "");
  if (/^\d+$/.test(cleaned)) return null;
  return TEAM_CRESTS[team] ?? null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es", {
    month: "short",
    day: "numeric",
  });
}

function getMatchY(sideIndex: number, matchIndex: number): number {
  const step = Math.pow(2, sideIndex) * S;
  const offset = ((Math.pow(2, sideIndex) - 1) * S) / 2;
  return HEADER_H + matchIndex * step + offset;
}

function getCenterY(sideIndex: number, matchIndex: number): number {
  return getMatchY(sideIndex, matchIndex) + CARD_H / 2;
}

function isPlaceholder(team: string | null): boolean {
  if (!team) return true;
  const cleaned = team.replace(/^W/, "");
  return /^\d+$/.test(cleaned);
}

// ── Compact match card for the bracket ──────────────────────────────────

function BracketMatchCard({
  match,
  prediction,
}: {
  match: Match;
  prediction: Prediction;
}) {
  const homeName = displayTeam(match.home_team);
  const awayName = displayTeam(match.away_team);
  const homeFlag = teamFlag(match.home_team);
  const awayFlag = teamFlag(match.away_team);
  const hasScore = match.home_score !== null;
  const kickoff = parseISO(match.kickoff_at);
  const isPast = isBefore(kickoff, new Date());

  return (
    <div
      className={`flex w-full flex-col justify-center rounded-md border px-2.5 py-1 ${
        hasScore
          ? "border-zinc-700 bg-[#1a1a24]"
          : isPast
            ? "border-zinc-800/60 bg-zinc-900/40"
            : "border-zinc-700/60 bg-[#1a1a24]/80"
      }`}
      style={{ height: CARD_H }}
    >
      {/* Home team + score */}
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-[13px] font-medium leading-tight text-white flex items-center gap-1.5">
          {homeFlag && <img src={homeFlag} alt="" className="h-3.5 w-3.5 object-contain" />}
          {homeName}
        </span>
        {hasScore && (
          <span className="shrink-0 text-[13px] font-bold tabular-nums text-white">
            {match.home_score}
          </span>
        )}
      </div>

      {/* Away team + score / vs */}
      <div className="mt-px flex items-center justify-between gap-1">
        <span className="truncate text-[13px] font-medium leading-tight text-white flex items-center gap-1.5">
          {awayFlag && <img src={awayFlag} alt="" className="h-3.5 w-3.5 object-contain" />}
          {awayName}
        </span>
        {hasScore ? (
          <span className="shrink-0 text-[13px] font-bold tabular-nums text-white">
            {match.away_score}
          </span>
        ) : (
          <span className="shrink-0 text-[11px] font-medium text-zinc-500">
            {isPast ? "-" : "vs"}
          </span>
        )}
      </div>

      {/* Date + prediction pill */}
      <div className="mt-0.5 flex items-center justify-between">
        <span className="text-[10px] text-zinc-600">
          {hasScore || isPast
            ? formatDate(match.kickoff_at)
            : formatDate(match.kickoff_at)}
        </span>
        {prediction && hasScore && prediction.points !== null && (
          <span className="text-[10px] font-medium text-green-500">
            +{prediction.points}
          </span>
        )}
        {prediction && !hasScore && !isPast && (
          <span className="text-[10px] text-blue-400">
            {prediction.home_score}-{prediction.away_score}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Connector column SVG ─────────────────────────────────────────────────

function ConnectorColumn({
  pairs,
  reverse = false,
}: {
  pairs: Array<{ s1: number; s2: number; t: number }>;
  reverse?: boolean;
}) {
  if (pairs.length === 0) return null;

  return (
    <svg
      width={CONN_W}
      height={TOTAL_H}
      className="shrink-0"
      style={{ minWidth: CONN_W }}
    >
      <defs>
        <clipPath id="conn-clip">
          <rect x="0" y="0" width={CONN_W} height={TOTAL_H} />
        </clipPath>
      </defs>
      <g clipPath="url(#conn-clip)">
        {pairs.map((pair, i) => {
          const leftX = reverse ? CONN_W : 0;
          const rightX = reverse ? 0 : CONN_W;
          const midX = CONN_W / 2;

          return (
            <g key={i}>
              <line
                x1={leftX}
                y1={pair.s1}
                x2={midX}
                y2={pair.s1}
                stroke="#3f3f46"
                strokeWidth={1.5}
              />
              <line
                x1={leftX}
                y1={pair.s2}
                x2={midX}
                y2={pair.s2}
                stroke="#3f3f46"
                strokeWidth={1.5}
              />
              <line
                x1={midX}
                y1={pair.s1}
                x2={midX}
                y2={pair.s2}
                stroke="#3f3f46"
                strokeWidth={1.5}
              />
              <line
                x1={midX}
                y1={pair.t}
                x2={rightX}
                y2={pair.t}
                stroke="#3f3f46"
                strokeWidth={1.5}
              />
              <circle cx={rightX} cy={pair.t} r={2} fill="#3f3f46" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ── Build connector pairs between two rounds ─────────────────────────────

function buildConnectorPairs(
  prevSideIndex: number,
  matchCount: number,
): Array<{ s1: number; s2: number; t: number }> {
  const pairs: Array<{ s1: number; s2: number; t: number }> = [];
  const targetCount = matchCount / 2;
  for (let j = 0; j < targetCount; j++) {
    pairs.push({
      s1: getCenterY(prevSideIndex, j * 2),
      s2: getCenterY(prevSideIndex, j * 2 + 1),
      t: getCenterY(prevSideIndex + 1, j),
    });
  }
  return pairs;
}

// ── Round column ─────────────────────────────────────────────────────────

function RoundColumn({
  label,
  matches,
  sideIndex,
  predictions,
}: {
  label: string;
  matches: Match[];
  sideIndex: number;
  predictions: Map<number, Prediction>;
}) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: ROUND_COL_W, minWidth: ROUND_COL_W, height: TOTAL_H }}
    >
      {/* Round header */}
      <div
        className="sticky top-0 z-10 flex items-center border-b border-zinc-800/60 bg-[#111118] px-2"
        style={{ height: HEADER_H }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </span>
      </div>

      {/* Match cards */}
      {matches.map((match, i) => (
        <div
          key={match.id}
          className="absolute left-2 right-2"
          style={{ top: getMatchY(sideIndex, i) }}
        >
          <BracketMatchCard
            match={match}
            prediction={predictions.get(match.id) ?? null}
          />
        </div>
      ))}
    </div>
  );
}

// ── Side builder ─────────────────────────────────────────────────────────

type SideRound = {
  roundName: string;
  label: string;
  matches: Match[];
  sideIndex: number;
};

function buildSideRounds(
  matchesByRound: Record<string, Match[]>,
  startIndex: number,
  count: number,
): SideRound[] {
  return KNOCKOUT_ROUNDS.map((roundName, i) => {
    const all = matchesByRound[roundName] ?? [];
    const sorted = [...all].sort(
      (a, b) =>
        new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime(),
    );
    const slice = sorted.slice(startIndex, startIndex + count);
    return {
      roundName,
      label: ROUND_LABELS[roundName] ?? roundName,
      matches: slice,
      sideIndex: i,
    };
  });
}

// ── Empty state ──────────────────────────────────────────────────────────

function EmptyBracket() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#1a1a24] p-6 text-center text-sm text-zinc-500">
      El cuadro de eliminatorias aún no está disponible
    </div>
  );
}

// ── Main Bracket Component ────────────────────────────────────────────────

export default function Bracket({
  matchesByRound,
  predictions,
}: {
  matchesByRound: Record<string, Match[]>;
  predictions: Map<number, Prediction>;
  userId: string; // kept for API compat, unused in visual-only bracket
}) {
  const hasAny = KNOCKOUT_ROUNDS.some(
    (r) => (matchesByRound[r]?.length ?? 0) > 0,
  );
  const hasFinal = (matchesByRound["Final"]?.length ?? 0) > 0;

  if (!hasAny && !hasFinal) return <EmptyBracket />;

  const finalMatch = hasFinal ? [...(matchesByRound["Final"] ?? [])].sort(
    (a, b) =>
      new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime(),
  )[0] : null;

  // Determine how many matches per round per side
  function sideCount(roundName: string): number {
    const total = (matchesByRound[roundName] ?? []).length;
    return Math.ceil(total / 2);
  }

  const leftRounds = buildSideRounds(matchesByRound, 0, 8); // first half
  const rightRounds = buildSideRounds(
    matchesByRound,
    (matchesByRound["Round of 32"] ?? []).length / 2,
    8,
  );

  // Build connector data
  function buildConnectors(
    rounds: SideRound[],
    reverse: boolean,
  ): Array<{ pairs: Array<{ s1: number; s2: number; t: number }> }> {
    const connectors: Array<{
      pairs: Array<{ s1: number; s2: number; t: number }>;
    }> = [];

    for (let i = 0; i < rounds.length - 1; i++) {
      const count = rounds[i].matches.length;
      if (count < 2) {
        connectors.push({ pairs: [] });
        continue;
      }
      connectors.push({
        pairs: buildConnectorPairs(i, count),
      });
    }

    // Connector from last round to final
    const lastCount = rounds[rounds.length - 1]?.matches.length ?? 0;
    const lastIdx = rounds.length - 1;
    if (lastCount >= 2) {
      connectors.push({
        pairs: [
          {
            s1: getCenterY(lastIdx, 0),
            s2: getCenterY(lastIdx, 1),
            t: getCenterY(lastIdx, 0) + S * Math.pow(2, lastIdx) / 2 - CARD_H / 2 + CARD_H / 2,
          },
        ],
      });
    } else if (lastCount === 1) {
      // Just draw a line from SF to Final
      const sfCenter = getCenterY(lastIdx, 0);
      connectors.push({
        pairs: [{ s1: sfCenter, s2: sfCenter, t: sfCenter }],
      });
    } else {
      connectors.push({ pairs: [] });
    }

    return connectors;
  }

  const leftConns = buildConnectors(leftRounds, false);
  const rightConns = buildConnectors(rightRounds, true);

  // Final position
  const finalY = leftRounds.length > 0
    ? getMatchY(leftRounds.length - 1, 0)
    : HEADER_H + TOTAL_H / 2 - CARD_H / 2;

  // Determine which side-connector from SF to Final to show
  // Left SF → Final and Right SF → Final
  const leftFinalConn: Array<{ s1: number; s2: number; t: number }> = [];
  const rightFinalConn: Array<{ s1: number; s2: number; t: number }> = [];
  const finalCenter = finalY + CARD_H / 2;

  if (leftRounds.length > 0) {
    const leftMatches = leftRounds[leftRounds.length - 1]?.matches ?? [];
    if (leftMatches.length === 1) {
      const center = getCenterY(leftRounds.length - 1, 0);
      leftFinalConn.push({ s1: center, s2: center, t: finalCenter });
    } else if (leftMatches.length >= 2) {
      const pairs = buildConnectorPairs(leftRounds.length - 1, leftMatches.length);
      leftFinalConn.push(...pairs.map((p) => ({ ...p, t: finalCenter })));
    }
  }

  if (rightRounds.length > 0) {
    const rightMatches = rightRounds[rightRounds.length - 1]?.matches ?? [];
    if (rightMatches.length === 1) {
      const center = getCenterY(rightRounds.length - 1, 0);
      rightFinalConn.push({ s1: center, s2: center, t: finalCenter });
    } else if (rightMatches.length >= 2) {
      const pairs = buildConnectorPairs(rightRounds.length - 1, rightMatches.length);
      rightFinalConn.push(...pairs.map((p) => ({ ...p, t: finalCenter })));
    }
  }

  // Filter out empty connectors
  function nonEmptyConns(
    conns: Array<{ pairs: Array<{ s1: number; s2: number; t: number }> }>,
  ) {
    return conns.filter((c) => c.pairs.length > 0);
  }

  const showLeftConns = nonEmptyConns(leftConns);
  const showRightConns = nonEmptyConns(rightConns);

  return (
    <div className="overflow-x-auto w-full pb-4">
      <div className="inline-flex px-2" style={{ gap: 0 }}>
        {/* ── LEFT SIDE ── */}
        {leftRounds.map((r, i) => (
          <div key={`left-${r.roundName}`} className="flex">
            <RoundColumn
              label={r.label}
              matches={r.matches}
              sideIndex={r.sideIndex}
              predictions={predictions}
            />
            {i < leftRounds.length - 1 &&
              leftConns[i]?.pairs.length > 0 && (
                <ConnectorColumn pairs={leftConns[i].pairs} reverse={false} />
              )}
          </div>
        ))}

        {/* SF → Final connector (left) */}
        {leftFinalConn.length > 0 && (
          <ConnectorColumn pairs={leftFinalConn} reverse={false} />
        )}

        {/* ── FINAL ── */}
        <div
          className="relative shrink-0"
          style={{
            width: ROUND_COL_W,
            minWidth: ROUND_COL_W,
            height: TOTAL_H,
          }}
        >
          <div
            className="sticky top-0 z-10 flex items-center justify-center border-b border-zinc-800/60 bg-[#111118] px-2"
            style={{ height: HEADER_H }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Final
            </span>
          </div>

          {finalMatch ? (
            <div
              className="absolute left-2 right-2"
              style={{ top: finalY }}
            >
              <BracketMatchCard
                match={finalMatch}
                prediction={predictions.get(finalMatch.id) ?? null}
              />
            </div>
          ) : (
            <div
              className="absolute left-2 right-2 flex items-center justify-center rounded-md border border-dashed border-zinc-800 bg-zinc-900/30 text-[11px] text-zinc-600"
              style={{ top: finalY, height: CARD_H }}
            >
              Por definir
            </div>
          )}
        </div>

        {/* SF → Final connector (right) */}
        {rightFinalConn.length > 0 && (
          <ConnectorColumn pairs={rightFinalConn} reverse={true} />
        )}

        {/* ── RIGHT SIDE (reversed order) ── */}
        {[...rightRounds].reverse().map((r, i) => {
          const origIndex = rightRounds.length - 1 - i;
          const nextOrigIndex = origIndex - 1;

          return (
            <div key={`right-${r.roundName}`} className="flex">
              {/* Connector from this round to the next (more central) round */}
              {i > 0 &&
                nextOrigIndex >= 0 &&
                rightConns[nextOrigIndex]?.pairs.length > 0 && (
                  <ConnectorColumn
                    pairs={rightConns[nextOrigIndex].pairs}
                    reverse={true}
                  />
                )}

              <RoundColumn
                label={r.label}
                matches={r.matches}
                sideIndex={r.sideIndex}
                predictions={predictions}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
