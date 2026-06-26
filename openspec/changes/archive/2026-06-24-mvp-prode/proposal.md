# Proposal: MVP Prode — WC2026 Prediction Pool

## Intent

Ship a PWA before June 28 so ~15 friends submit predictions. Group stage is over — show results only. No API dependency.

## Scope

**In**: Supabase schema; invite + Supabase Auth; group-stage results (read-only); R32+ prediction forms; 5/3/1 scoring; leaderboard w/ tiebreakers; admin panel (invite codes, results, overview); PWA manifest + SW + dark UI.
**Out**: API-Football, push notifications, comments, real-time, multi-tournament.

## Capabilities

### New
- `invite-auth`: Invite code validation + Supabase Auth registration w/ admin flag
- `match-listing`: Past match results (read-only), future prediction forms
- `predictions`: Submit, update, lock per match before kickoff
- `scoring`: 5/3/1 points calculation per user
- `leaderboard`: Ranked table w/ tiebreaker (exact → result → reg date)
- `admin-panel`: Admin-only routes for invite codes & results
- `pwa-setup`: Manifest, service worker, install prompt, offline shell

### Modified
- None (greenfield)

## Approach

Next.js App Router + Supabase Auth + DB. RLS enforces read/write by match state. Admin flag via `user_roles`. Manual result entry. Serwist for PWA. Tailwind dark theme, mobile-first. Data seeded from known WC2026 results.

## Affected Areas

| Area | Impact | What |
|------|--------|------|
| `src/app/` | New | Pages: matches, leaderboard, admin, auth |
| `src/lib/supabase/` | New | Client, server client, middleware |
| `src/lib/db/schema.sql` | New | Tables, RLS, seed |
| `src/lib/scoring.ts` | New | Points engine |
| `src/components/` | New | MatchCard, PredictionForm, LeaderboardTable |
| `next.config.ts` | Modified | Serwist plugin |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Miss June 28 deadline | Med | Cut scope; manual entry > automation |
| RLS leaks predictions | Med | Test per role; admin-only result write |
| No test suite | High | Manual QA on critical paths; add vitest later |
| PWA on iOS | Med | Test Safari; document Serwist limits |

## Rollback Plan

- Supabase: reversible migrations, toggle RLS
- Auth: disable invite code, serve maintenance page
- Data: re-run seed SQL w/ `TRUNCATE`
- PWA: revert `next.config.ts`, remove Serwist

## Dependencies

- Supabase (free tier)
- Serwist 9.5.11 (installed)
- WC2026 schedule + results (manual seed)

## Success Criteria

- [ ] User registers w/ invite code and logs in via Supabase Auth
- [ ] Group matches display real results (no prediction form)
- [ ] R32+ matches show forms that lock at kickoff
- [ ] Admin enters results; leaderboard scores update
- [ ] Tiebreaker applied: exact → result → reg date
- [ ] PWA installs on mobile; offline shell loads
- [ ] All flows work at 375px viewport
