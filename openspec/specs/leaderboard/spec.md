# Leaderboard Specification

## Purpose

Display a ranked table of all participants ordered by total score. Apply tiebreaker rules for equal scores.

## Requirements

### Requirement: Ranked Display

The leaderboard MUST display all participants ranked by total score descending. Each row MUST show: rank, participant name/email, total points, exact-score count, correct-result count. The current user's row MUST be highlighted.

#### Scenario: Standard ranking

- GIVEN three users with scores 15, 10, and 5
- WHEN viewing the leaderboard
- THEN ranks display as 1st (15), 2nd (10), 3rd (5)
- AND the logged-in user's row has a visual highlight

#### Scenario: Empty leaderboard

- GIVEN no match results have been entered
- WHEN viewing the leaderboard
- THEN the table shows all participants with 0 points
- AND ranks display as 1st, 2nd, etc. (all tied)

### Requirement: Tiebreaker

When two or more participants have equal total score, the system MUST tiebreak in this order: (1) most exact-score predictions (5pt), (2) most correct-result predictions (3pt), (3) earliest registration date. If still tied after all criteria, same rank is assigned.

#### Scenario: Tiebreaker by exact scores

- GIVEN User A and User B both have 20 points
- AND User A has 3 exact scores, User B has 2 exact scores
- WHEN the leaderboard is viewed
- THEN User A ranks above User B

#### Scenario: Tiebreaker by registration date

- GIVEN User A and User B both have 10 points, 1 exact score, and 1 correct result
- AND User A registered on June 1, User B on June 5
- WHEN the leaderboard is viewed
- THEN User A ranks above User B

#### Scenario: Full tie

- GIVEN User A and User B are identical across all tiebreaker criteria
- WHEN the leaderboard is viewed
- THEN both users receive the same rank number
