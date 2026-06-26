# Scoring Specification

## Purpose

Calculate points for each user's predictions when match results are entered by an admin. Scoring runs automatically on result entry using the 5/3/1 system.

## Requirements

### Requirement: Score Calculation

The scoring engine MUST calculate points per prediction using: **5 points** for exact scoreline, **3 points** for correct result (winner or draw) but wrong score, **1 point** for predicting the correct advancing team when the match goes to penalties and the 90-minute score differs.

#### Scenario: Exact scoreline

- GIVEN a user predicted 2-1 for Argentina vs Netherlands
- WHEN the admin enters result 2-1
- THEN the user receives **5 points** for that match

#### Scenario: Correct result, wrong score

- GIVEN a user predicted 3-0 for Argentina vs Netherlands
- WHEN the admin enters result 2-1
- THEN the user receives **3 points** (Argentina won, wrong scoreline)

#### Scenario: Wrong result

- GIVEN a user predicted 0-2 for Argentina vs Netherlands
- WHEN the admin enters result 2-1
- THEN the user receives **0 points**

#### Scenario: Knockout advance via penalties

- GIVEN a user predicted 1-0 for Argentina (advance) vs Netherlands
- WHEN the 90-minute result is 1-1 and Argentina advances on penalties
- THEN the user receives **1 point** (correct advancing team, wrong 90-min score)

### Requirement: Automated Scoring

Scoring MUST run automatically whenever an admin enters or updates a match result. Scores are stored in a `user_scores` table or computed from a `scores` view. The total score is the sum of all individual match scores.

#### Scenario: Score updates on result entry

- GIVEN a match result is entered by an admin
- WHEN the scoring function runs
- THEN all user predictions for that match are scored
- AND the leaderboard reflects updated totals

#### Scenario: Result update re-scores

- GIVEN a match result was entered as 2-1 and later corrected to 3-1
- WHEN the admin updates the result
- THEN all predictions for that match are re-scored
- AND the leaderboard is updated
