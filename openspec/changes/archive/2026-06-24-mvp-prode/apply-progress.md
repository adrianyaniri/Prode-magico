# Apply Progress: MVP Prode — WC2026 Prediction Pool

**Status**: All 28 tasks complete
**Mode**: Standard (no TDD)
**Delivery**: Single PR — size:exception approved

## File Manifest

### Phase 1: Foundation
| File | Action | Description |
|------|--------|-------------|
| `.env.local` | Created | Supabase env vars template (URL, anon key, service role) |
| `src/lib/db/schema.sql` | Created | Tables (matches, predictions, invite_codes, user_roles), indexes, RLS policies, RPC functions, seed: invite codes + 104 matches + 48 results |
| `src/lib/supabase/client.ts` | Created | Browser Supabase client (createBrowserClient) |
| `src/lib/supabase/server.ts` | Created | Server Supabase client (createServerClient + cookies) |
| `src/lib/supabase/middleware.ts` | Created | Middleware client for session refresh |
| `src/lib/supabase/admin.ts` | Created | Admin client (service_role key, bypasses RLS) |
| `src/middleware.ts` | Created | Session refresh on every request |
| `src/components/Providers.tsx` | Created | Supabase session context provider |

### Phase 2: Auth Flow
| File | Action | Description |
|------|--------|-------------|
| `src/app/auth/sign-up/page.tsx` | Created | Registration with invite code validation + role assignment |
| `src/app/auth/sign-in/page.tsx` | Created | Email/password login form |
| `src/app/auth/callback/route.ts` | Created | Auth callback handler (exchange code for session) |
| `src/app/(dashboard)/layout.tsx` | Created | Auth gate — redirects to /sign-in if unauthenticated |
| `src/app/api/auth/validate-invite/route.ts` | Created | Validates invite code via admin client |
| `src/app/api/auth/assign-role/route.ts` | Created | Inserts user_roles row (admin/participant) |
| `src/app/api/auth/consume-invite/route.ts` | Created | Increments invite code uses_count |

### Phase 3: Match System + Predictions
| File | Action | Description |
|------|--------|-------------|
| `src/components/MatchCard.tsx` | Created | Match display — teams, score, status (Final/Open/Locked/Result Pending) |
| `src/components/PredictionForm.tsx` | Created | Score inputs + upsert to predictions table |
| `src/app/(dashboard)/matches/page.tsx` | Created | Groups matches by round, renders MatchCards with predictions |
| `src/app/page.tsx` | Modified | Redirects to /matches if authed, else landing with sign-in/up links |

### Phase 4: Scoring + Leaderboard
| File | Action | Description |
|------|--------|-------------|
| `src/lib/scoring.ts` | Created | calculateScore(): 5 exact / 3 result / 1 penalty advance / 0 wrong |
| `src/components/LeaderboardTable.tsx` | Created | Ranked table with tiebreaker columns + current user highlight |
| `src/app/(dashboard)/leaderboard/page.tsx` | Created | Fetches predictions, aggregates points, sorts with tiebreaker |

### Phase 5: Admin Panel
| File | Action | Description |
|------|--------|-------------|
| `src/app/admin/layout.tsx` | Created | Role gate — 403 + redirect for non-admin |
| `src/app/admin/page.tsx` | Created | Overview dashboard with counts (users, matches, predictions, codes, scored) |
| `src/app/admin/invite-codes/page.tsx` | Created | View all codes + generate new ones |
| `src/app/admin/results/page.tsx` | Created | Match selector + score entry + triggers scoring API |
| `src/app/api/admin/results/route.ts` | Created | Updates match result + calculates points for all predictions |
| `src/app/api/admin/invite-codes/route.ts` | Created | GET all codes, POST create new code |

### Phase 6: PWA + Polish
| File | Action | Description |
|------|--------|-------------|
| `src/app/manifest.ts` | Created | Dynamic manifest.json (standalone, dark theme, icons) |
| `src/app/sw.ts` | Created | Serwist service worker (precache + runtime caching + offline nav) |
| `src/app/offline/page.tsx` | Created | Offline shell with retry button |
| `src/components/InstallPrompt.tsx` | Created | beforeinstallprompt handler + install button |
| `src/components/NavBar.tsx` | Created | Bottom navigation (Matches, Leaderboard) |
| `src/app/layout.tsx` | Modified | Manifest link, theme-color, apple meta tags, Providers wrapper, InstallPrompt |
| `next.config.ts` | Modified | withSerwist plugin (disabled in dev, webpack for production builds) |
| `package.json` | Modified | Build script: `next build --webpack` (for Serwist compatibility) |
| `public/icons/icon-192x192.png` | Created | PWA icon 192x192 |
| `public/icons/icon-512x512.png` | Created | PWA icon 512x512 |
| `src/app/globals.css` | Inspected | Dark theme already configured — no changes needed |

## Deviations from Design

None — implementation matches design decisions:

- `user_roles` table for role storage (not `raw_app_metadata`) ✓
- Pure TS `calculateScore()` for scoring engine ✓
- Denormalized `points` on predictions rows ✓
- `(dashboard)` route group for authenticated pages ✓
- `@serwist/next` for PWA ✓

## Issues Found

1. **Next.js 16 Turbopack vs Serwist**: Serwist 9.x adds a webpack config that conflicts with Next.js 16's default Turbopack. Fixed by using `--webpack` flag in build script and disabling Serwist in development mode.
2. **ServiceWorkerGlobalScope type**: Not available in standard TypeScript. Fixed by using `WorkerGlobalScope` with `SerwistGlobalConfig` from the `serwist` package.
3. **Next.js 16 metadata API change**: `themeColor` and `viewport` must use the `export const viewport: Viewport` convention instead of being in the metadata export.
4. **PWA icons**: Generated placeholder PNG icons programmatically. For production, replace with proper branded icons.

## Build Verification

Build completed successfully with `npm run build --webpack`. All 19 routes compiled:

- Static: `/`, `/_not-found`, `/auth/sign-in`, `/auth/sign-up`, `/manifest.webmanifest`, `/offline`
- Dynamic: `/admin/*`, `/api/*`, `/auth/callback`, `/leaderboard`, `/matches`
- Proxy (Middleware): Session refresh

## Remaining Tasks

None — all 28 tasks complete.

## Prerequisites for Production

1. Create Supabase project and run `schema.sql` in SQL editor
2. Set `.env.local` with real Supabase credentials
3. Replace placeholder PWA icons with branded assets
4. Verify Supabase RLS policies work correctly with auth.users
