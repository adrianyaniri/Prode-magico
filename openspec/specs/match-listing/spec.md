# Match Listing Specification

## Purpose

Display WC2026 match data: group stage results as read-only cards, knockout match cards with dates and prediction status. Matches before June 28 show only results; knockout matches (R32+) show forms when predictions are open.

## Requirements

### Requirement: Group Stage Results Display

Group stage matches MUST display final scores and match status only. They MUST NOT display prediction forms or allow any prediction interaction. Each card MUST show: home team, away team, score, match date, and match status.

#### Scenario: Group stage match with result

- GIVEN the user is on the matches page
- WHEN viewing a group stage match with a score entered
- THEN the card displays home team, away team, final score, and "Final" status
- AND no prediction form or button is rendered

#### Scenario: Group stage match without result

- GIVEN a group stage match has no score yet
- WHEN viewing the match card
- THEN the card displays teams, date, and "Result pending" status
- AND no prediction form is rendered

### Requirement: Knockout Match Cards

Knockout matches (Round of 32 onwards) MUST display match cards with date, teams, and a prediction form when predictions are open. Cards MUST visually distinguish: open for predictions, locked (kickoff passed), or result available.

#### Scenario: Knockout match open for predictions

- GIVEN a R32 match with kickoff on June 30 at 17:00
- WHEN the current time is before June 30 17:00
- THEN the match card shows team inputs for home/away score
- AND the Submit Prediction button is enabled

#### Scenario: Knockout match locked at kickoff

- GIVEN a R32 match with kickoff on June 29 at 13:00
- WHEN the current time is June 29 13:01
- THEN the match card shows "Predictions locked"
- AND score inputs are disabled or hidden

#### Scenario: Knockout match with result entered

- GIVEN an admin has entered the result for a locked match
- WHEN viewing the match card
- THEN the card shows the final score
- AND the user's prediction (if any) is displayed below the result
