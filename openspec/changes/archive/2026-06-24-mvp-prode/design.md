# Design: MVP Prode — WC2026 Prediction Pool

## Technical Approach

Greenfield Next.js App Router PWA. Supabase Auth handles identity; invite codes gate registration. Match data and predictions in Supabase PG with RLS per role and match state. Scoring is a pure TS function called on result entry — denormalized `points` on `predictions` rows. Admin routes protected by middleware + layout role check. Serwist precaches static assets and serves offline shell.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Role storage | `user_roles` table (FK to auth.users) | `raw_app_metadata`, custom claims | `raw_app_metadata` not meant for app roles; separate table is RLS-queryable and auditable |
| Scoring engine | TS pure function `calculateScore()` | PL/pgSQL trigger | Version-controlled, testable, no migration needed for logic; 15 users makes perf irrelevant |
| Points storage | Denormalized `predictions.points` (int, nullable) | Compute-live view | Leaderboard is `SUM(points) GROUP BY user` — trivial query. Re-score on result update is an upsert loop |
| Route scoping | `(dashboard)` route group; `/admin` layout guard | Single middleware for everything | Layout role check survives middleware refactors; middleware handles auth session only |
| PWA approach | `@serwist/next` build-time SW | Workbox, next-pwa | Already installed, maintained successor. SW generated at build time |

## Data Flow

```
Auth:
  Browser → POST /auth/sign-up {code,email,pass}
    → validate invite_code in Supabase
    → supabase.auth.signUp() → session
    → INSERT user_roles (admin if code==ADMIN2026)
    → redirect /matches

Scoring (admin enters result):
  Admin → POST /admin/results {matchId, 2, 1}
    → UPDATE matches SET score
    → SELECT predictions WHERE match_id = ?
    → for each: calculateScore(result, prediction)
    → UPDATE predictions SET points = N
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/db/schema.sql` | Create | Tables + RLS + seed (104 matches, 48 results) |
| `src/lib/supabase/client.ts` | Create | Browser Supabase client |
| `src/lib/supabase/server.ts` | Create | Server Supabase client (cookie-based) |
| `src/lib/supabase/middleware.ts` | Create | Middleware client for session refresh |
| `src/lib/scoring.ts` | Create | `calculateScore() → 5\|3\|1\|0` |
| `src/middleware.ts` | Create | Session refresh on every request |
| `src/app/layout.tsx` | Modify | Manifest link, theme-color, dark default |
| `src/app/page.tsx` | Modify | Invite code landing page |
| `src/app/sw.ts` | Create | Serwist SW entry |
| `src/app/manifest.ts` | Create | Dynamic manifest.json |
| `src/app/offline/page.tsx` | Create | Offline shell |
| `src/app/auth/sign-up/page.tsx` | Create | Registration form |
| `src/app/auth/sign-in/page.tsx` | Create | Login form |
| `src/app/auth/callback/route.ts` | Create | Auth callback |
| `src/app/(dashboard)/layout.tsx` | Create | Authenticated shell + nav |
| `src/app/(dashboard)/matches/page.tsx` | Create | Match listing |
| `src/app/(dashboard)/leaderboard/page.tsx` | Create | Ranked table |
| `src/app/admin/layout.tsx` | Create | Admin role gate |
| `src/app/admin/page.tsx` | Create | Admin overview |
| `src/app/admin/invite-codes/page.tsx` | Create | Invite code CRUD |
| `src/app/admin/results/page.tsx` | Create | Result entry UI |
| `src/components/MatchCard.tsx` | Create | Match display (result/form) |
| `src/components/PredictionForm.tsx` | Create | Score input + lock logic |
| `src/components/LeaderboardTable.tsx` | Create | Ranked table |
| `src/components/NavBar.tsx` | Create | Bottom nav |
| `src/components/InstallPrompt.tsx` | Create | PWA install button |
| `src/components/Providers.tsx` | Create | Supabase provider wrapper |
| `next.config.ts` | Modify | `withSerwist` plugin |

## RLS Policy Summary

| Table | Operation | Policy |
|-------|-----------|--------|
| `matches` | SELECT | All authenticated |
| `matches` | UPDATE | `admin` only |
| `predictions` | SELECT | Own rows (admin: all) |
| `predictions` | INSERT/UPDATE | Own user_id, KO round, kickoff > now() |
| `invite_codes` | ALL | `admin` only |
| `user_roles` | SELECT | All authenticated |

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | `calculateScore()` | Manual vitest — edge cases: exact, correct result, penalty win, wrong, draw |
| Integration | Auth flow, RLS | Manual browser + Supabase SQL editor per role |
| E2E | Predict → score → leaderboard | Manual at 375px |
| PWA | Manifest, SW, offline | Chrome DevTools manifest/SW pane, offline toggle |

## Migration / Rollout

Greenfield — run `schema.sql` in Supabase SQL editor. No feature flag needed. All routes are new.

## Open Questions

- [ ] Penalty handling: store `penalty_winner` on `matches` or infer from draw + KO round?
- [ ] iOS PWA: confirm standalone mode works with Serwist or needs Apple-specific meta tags
