# Proposal: Fix Penalty Score Calculation

## Intent

Bug fix: penalty shootout matches produce wrong (sometimes negative) scores because `fullTime` already includes extra time + penalty goals. The formula `fullTime - penalties` should be `fullTime - extraTime - penalties`. This corrupts downstream scoring, draw detection, and points calculation.

## Scope

### In Scope
- Fix subtraction formula in `sync-results/route.ts:277,280` — subtract `extraTime` before `penalties`
- Remove `repopulate/route.ts` entirely (user-deemed dangerous — drops+recreates match data)
- Remove `RepopulateButton.tsx` (dead code, no imports)
- Auto-correct existing wrong data on next sync run

### Out of Scope
- Changes to scoring logic (5/3/1 points system) or `scoring/spec.md`
- Bracket calculator changes
- Data migration script (auto-heals via next sync)
- Testing infrastructure (no test runner exists per config)

## Capabilities

### New Capabilities
None — bug fix only, no new spec-level behavior.

### Modified Capabilities
None — the scoring spec (`openspec/specs/scoring`) is unchanged. Only data feeding into scoring is corrected.

## Approach

1. **sync-results/route.ts:277,280** — Add `extraTime` subtraction: `fullTime - extraTime - penalties`. Extra time values are null when no extra time was played (falls back to `?? 0`).
2. **repopulate/route.ts** — Remove entire file and its route registration.
3. **RepopulateButton.tsx** — Remove the component (unused, no imports in codebase).
4. Next sync run automatically overwrites wrong stored scores with corrected values — no migration needed.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/api/sync-results/route.ts:277,280` | Modified | Fix formula: `fullTime - penalties` → `fullTime - extraTime - penalties` |
| `src/app/api/repopulate/route.ts` | Removed | Delete dangerous repopulate endpoint |
| `src/components/RepopulateButton.tsx` | Removed | Delete dead UI component |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `extraTime` is null for non-ET matches | Low | Use `?? 0` fallback — nullish coalescing is safe |
| Wrong scores exist in DB until next sync | Medium | Acceptable — auto-fixes on next sync; no manual migration needed |
| Removal breaks something importing repopulate | Low | No imports found in codebase (grep confirmed dead code) |

## Rollback Plan

1. Revert the formula change in `sync-results/route.ts`
2. Restore `repopulate/route.ts` and `RepopulateButton.tsx` from git
3. Re-sync affected matches

## Dependencies

- None

## Success Criteria

- [ ] `sync-results` no longer produces negative scores for penalty shootout matches
- [ ] `repopulate/` route and `RepopulateButton` are gone from the codebase
- [ ] Existing wrong scores correct themselves on next scheduled sync
