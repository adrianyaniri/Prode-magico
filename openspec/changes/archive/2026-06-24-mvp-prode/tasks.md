# Tasks: MVP Prode — WC2026 Prediction Pool

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2500–3500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation + Auth) → PR 2 (Matches + Predictions) → PR 3 (Scoring + Leaderboard + Admin) → PR 4 (PWA + Polish) |
| Delivery strategy | ask-on-risk |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: size-exception
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Base |
|------|------|-----------|------|
| 1 | Schema + Supabase clients + Auth flow | PR 1 | main |
| 2 | Match listing + Prediction forms + MatchCard | PR 2 | PR 1 branch |
| 3 | Scoring engine + Leaderboard + Admin panel | PR 3 | PR 2 branch |
| 4 | PWA manifest + SW + offline + InstallPrompt | PR 4 | PR 3 branch |

## Phase 1: Foundation

- [x] 1.1 Create `src/lib/db/schema.sql` — tables (matches, predictions, invite_codes, user_roles), RLS, seed 104 matches / 48 results
- [x] 1.2 Create `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts` — browser + server + middleware clients
- [x] 1.3 Create `src/middleware.ts` — session refresh on every request
- [x] 1.4 Create `.env.local` template with `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY`
- [x] 1.5 Create `src/components/Providers.tsx` — Supabase provider wrapper

## Phase 2: Auth Flow

- [x] 2.1 Create `src/app/auth/sign-up/page.tsx` — registration form w/ invite code validation + role assignment
- [x] 2.2 Create `src/app/auth/sign-in/page.tsx` — email/password login form
- [x] 2.3 Create `src/app/auth/callback/route.ts` — OAuth callback handler
- [x] 2.4 Create `src/app/(dashboard)/layout.tsx` — authenticated shell, redirect to /matches

## Phase 3: Match System + Predictions

- [x] 3.1 Create `src/components/MatchCard.tsx` — teams, score, status badge (group=read-only, KO=form)
- [x] 3.2 Create `src/components/PredictionForm.tsx` — score inputs, submit, lock at kickoff
- [x] 3.3 Create `src/app/(dashboard)/matches/page.tsx` — list all matches grouped by round
- [x] 3.4 Update `src/app/page.tsx` — redirect to /matches if authed, else landing

## Phase 4: Scoring + Leaderboard

- [x] 4.1 Create `src/lib/scoring.ts` — `calculateScore()`: 5 exact / 3 result / 1 advance / 0 wrong
- [x] 4.2 Create `src/components/LeaderboardTable.tsx` — ranked rows w/ tiebreaker (exact → result → reg date)
- [x] 4.3 Create `src/app/(dashboard)/leaderboard/page.tsx` — fetch `SUM(points) GROUP BY user`, render table

## Phase 5: Admin Panel

- [x] 5.1 Create `src/app/admin/layout.tsx` — role gate, 403 for non-admin
- [x] 5.2 Create `src/app/admin/page.tsx` — overview with counts
- [x] 5.3 Create `src/app/admin/invite-codes/page.tsx` — view/create invite codes
- [x] 5.4 Create `src/app/admin/results/page.tsx` — result entry form, triggers scoring on save

## Phase 6: PWA + Polish

- [x] 6.1 Create `src/app/manifest.ts` — dynamic manifest.json (name, icons, standalone)
- [x] 6.2 Create `src/app/sw.ts` — Serwist service worker entry
- [x] 6.3 Create `src/app/offline/page.tsx` — offline shell
- [x] 6.4 Create `src/components/InstallPrompt.tsx` — `beforeinstallprompt` handler + install button
- [x] 6.5 Create `src/components/NavBar.tsx` — bottom nav (matches, leaderboard)
- [x] 6.6 Modify `src/app/layout.tsx` — manifest link, theme-color, dark defaults
- [x] 6.7 Modify `next.config.ts` — add `withSerwist` plugin
- [x] 6.8 Test all flows at 375px viewport, fix responsive issues
