# Predictions Specification

## Purpose

Allow authenticated users to submit and update predictions for R32+ knockout matches. Predictions lock at match kickoff. Group stage predictions are not supported.

## Requirements

### Requirement: Submit Prediction

A user MUST be able to submit a score prediction (home goals, away goals) for any R32+ match where the current time is before kickoff. Predictions are stored per user per match in a `predictions` table.

#### Scenario: Happy path — submit prediction

- GIVEN the user is authenticated and viewing a R32 match open for predictions
- WHEN the user enters home score `2` and away score `1` and clicks Submit
- THEN the prediction is saved to the `predictions` table
- AND the form displays a success confirmation
- AND the match card shows "Prediction submitted"

#### Scenario: Group stage prediction rejected

- GIVEN the user is viewing a group stage match
- WHEN the user attempts to submit a prediction
- THEN the UI does not render prediction inputs
- AND the API returns a 400 error if called directly

### Requirement: Update Prediction Before Kickoff

The user MUST be able to update their prediction any number of times before kickoff. Each update overwrites the previous prediction in the `predictions` table.

#### Scenario: Update existing prediction

- GIVEN the user has a saved prediction of 1-0 for a match
- WHEN the user changes it to 2-1 and saves before kickoff
- THEN the prediction record is updated to 2-1
- AND the lock time remains the match kickoff

### Requirement: Lock at Kickoff

Predictions MUST lock when the current time passes each match's kickoff time. Any submit or update attempt after lock MUST be rejected.

#### Scenario: Prediction rejected after kickoff

- GIVEN a match kicked off at 17:00 and current time is 17:05
- WHEN the user attempts to submit or update a prediction
- THEN the API returns a 403 error "Match has already started"
- AND the UI shows "Predictions locked" with disabled inputs

#### Scenario: Unauthenticated prediction rejected

- GIVEN a user is not logged in
- WHEN they attempt to submit a prediction
- THEN the API returns a 401 error
- AND the UI shows "Sign in to predict"
