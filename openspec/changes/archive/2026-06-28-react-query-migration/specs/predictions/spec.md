# Delta for Predictions

## ADDED Requirements

### Requirement: Offline Mutation Blocking

The system MUST prevent users from submitting or updating predictions when the network is offline.

#### Scenario: Offline mutation attempt

- GIVEN the user is offline
- WHEN the user attempts to submit or update a prediction
- THEN the mutation is blocked
- AND the UI displays an error or warning indicating that the action cannot be performed offline

## MODIFIED Requirements

### Requirement: Submit Prediction

A user MUST be able to submit a score prediction (home goals, away goals) for any R32+ match where the current time is before kickoff. Predictions are stored per user per match in a `predictions` table. The submission MUST apply an optimistic update to the React Query cache before the network request completes, and revert it if the request fails.
(Previously: A user MUST be able to submit a score prediction (home goals, away goals) for any R32+ match where the current time is before kickoff. Predictions are stored per user per match in a `predictions` table.)

#### Scenario: Happy path — submit prediction

- GIVEN the user is authenticated and viewing a R32 match open for predictions
- WHEN the user enters home score `2` and away score `1` and clicks Submit
- THEN the prediction is optimistically applied to the UI immediately
- AND the prediction is saved to the `predictions` table via network request
- AND the form displays a success confirmation
- AND the match card shows "Prediction submitted"

#### Scenario: Group stage prediction rejected

- GIVEN the user is viewing a group stage match
- WHEN the user attempts to submit a prediction
- THEN the UI does not render prediction inputs
- AND the API returns a 400 error if called directly

#### Scenario: Submit prediction network failure

- GIVEN the user is authenticated and online
- WHEN the user submits a prediction but the network request fails
- THEN the optimistic update is reverted in the UI
- AND an error message is displayed to the user

### Requirement: Update Prediction Before Kickoff

The user MUST be able to update their prediction any number of times before kickoff. Each update overwrites the previous prediction in the `predictions` table. The update MUST apply an optimistic update to the React Query cache, reverting on failure.
(Previously: The user MUST be able to update their prediction any number of times before kickoff. Each update overwrites the previous prediction in the `predictions` table.)

#### Scenario: Update existing prediction

- GIVEN the user has a saved prediction of 1-0 for a match
- WHEN the user changes it to 2-1 and saves before kickoff
- THEN the UI optimistically updates to 2-1 immediately
- AND the prediction record is updated to 2-1 via network request
- AND the lock time remains the match kickoff

#### Scenario: Update prediction network failure

- GIVEN the user has a saved prediction of 1-0
- WHEN the user changes it to 2-1 but the network request fails
- THEN the UI reverts the optimistic update back to 1-0
- AND an error message is displayed to the user
