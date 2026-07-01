# Tasks: Fix Penalty Score Calculation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~257 (10 modified + 247 deleted) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Fix formula + remove dead code | Single PR | All tasks independent, under 400 lines |

## Phase 1: Fix Scoring Bug

- [x] 1.1 In `src/app/api/sync-results/route.ts:275-282`, replace formula `fullTime - penalties` → `fullTime - (extraTime ?? 0) - penalties` for both home/away

## Phase 2: Remove Dead Code

- [x] 2.1 Delete `src/app/api/repopulate/route.ts` — endpoint will 404 automatically
- [x] 2.2 Delete `src/components/RepopulateButton.tsx` — no imports in codebase

## Phase 3: Verify

- [x] 3.1 Confirm `sync-results` no longer produces negative scores for penalty shootout matches
- [x] 3.2 Confirm `GET/POST /api/repopulate` returns 404
- [x] 3.3 Confirm no compile errors after file deletions
