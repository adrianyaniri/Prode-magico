import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateScore, calculatePenaltyScore } from "@/lib/scoring";

export async function POST(request: Request) {
  const { matchId, homeScore, awayScore, penaltyWinner } =
    await request.json();

  if (!matchId || homeScore === undefined || awayScore === undefined) {
    return NextResponse.json(
      { error: "matchId, homeScore, awayScore are required" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // 1. Fetch match info to determine if it's a KO round
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("round")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    return NextResponse.json(
      { error: "Match not found" },
      { status: 404 },
    );
  }

  const isKnockout = match.round !== "Group";

  // 2. Update match result
  const updateFields: Record<string, number | string | null> = {
    home_score: homeScore,
    away_score: awayScore,
  };
  if (isKnockout && penaltyWinner) {
    updateFields.penalty_winner = penaltyWinner;
  }

  const { error: updateError } = await supabase
    .from("matches")
    .update(updateFields)
    .eq("id", matchId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update match result: " + updateError.message },
      { status: 500 },
    );
  }

  // 3. Fetch all predictions for this match
  const { data: predictions, error: fetchError } = await supabase
    .from("predictions")
    .select("id, user_id, home_score, away_score")
    .eq("match_id", matchId);

  if (fetchError) {
    return NextResponse.json(
      { error: "Failed to fetch predictions" },
      { status: 500 },
    );
  }

  // 4. Calculate and update points for each prediction
  const isDraw = homeScore === awayScore;
  const wentToPenalties = isDraw && isKnockout && penaltyWinner;

  for (const pred of predictions ?? []) {
    let points: number;

    if (wentToPenalties) {
      // Determine which team the user predicted to advance
      const predictedAdvancer =
        pred.home_score > pred.away_score
          ? "home"
          : pred.away_score > pred.home_score
            ? "away"
            : null;

      points = calculatePenaltyScore(
        pred.home_score,
        pred.away_score,
        homeScore,
        awayScore,
        penaltyWinner,
        predictedAdvancer ?? "",
      );
    } else {
      points = calculateScore(
        pred.home_score,
        pred.away_score,
        homeScore,
        awayScore,
      );
    }

    const { error: pointsError } = await supabase
      .from("predictions")
      .update({ points })
      .eq("id", pred.id);

    if (pointsError) {
      console.error(
        `Failed to update points for prediction ${pred.id}:`,
        pointsError,
      );
    }
  }

  return NextResponse.json({
    success: true,
    predictionsScored: predictions?.length ?? 0,
    wentToPenalties: !!wentToPenalties,
  });
}
