# Tasks: react-query-migration

## Phase 1: Foundation / Infrastructure

- [x] 1.1 Install dependencies: `npm install @tanstack/react-query @tanstack/react-query-devtools`
- [x] 1.2 Create `src/components/ReactQueryProvider.tsx` to initialize `QueryClient` and wrap `QueryClientProvider` around children.
- [x] 1.3 Update `src/components/Providers.tsx` to include `<ReactQueryProvider>` inside the existing providers.
- [x] 1.4 Update `src/app/sw.ts` `runtimeCaching` to exclude RSC payloads (e.g., requests with `?_rsc=` or `RSC` header) and Supabase API routes from `defaultCache`.

## Phase 2: Core Implementation (Data Fetching & Mutations)

- [x] 2.1 Update `src/components/PredictionForm.tsx` to use `useMutation` for submitting/updating predictions.
- [x] 2.2 In `PredictionForm.tsx` `onMutate`, check `navigator.onLine` and throw an error to block if offline.
- [x] 2.3 In `PredictionForm.tsx` `onMutate`, implement optimistic updates, reverting in `onError`, and invalidating query in `onSettled`.
- [x] 2.4 Update `src/components/PredictionForm.tsx` to use `useQuery` seeded with `initialData` for reading current prediction state.
- [x] 2.5 Update `src/components/BonusPredictionsCard.tsx` to use `useMutation` with offline blocking and optimistic updates.
- [x] 2.6 Migrate `src/components/LeaderboardTable.tsx` to use `useQuery` for background refetching and client-side caching.
- [x] 2.7 Migrate `src/components/GroupStandings.tsx` to use `useQuery` for background refetching and client-side caching.

## Phase 3: Integration / Wiring

- [x] 3.1 Update Server Components rendering `PredictionForm` to pass correct `initialData`.
- [x] 3.2 Update Server Components rendering `LeaderboardTable` to pass correct `initialData`.
- [x] 3.3 Update Server Components rendering `GroupStandings` to pass correct `initialData`.
- [x] 3.4 Replace `router.refresh()` with React Query cache invalidation across all migrated components.

## Phase 4: Verification / Cleanup

- [x] 4.1 Verify offline mutation attempt displays error and prevents submission.
- [x] 4.2 Verify Serwist service worker bypasses RSC and API routes correctly.
- [x] 4.3 Verify optimistic UI updates reflect instantly and revert on simulated network failure.
- [x] 4.4 Verify background refetching updates UI properly for Leaderboard and Group Standings when window is refocused.
- [x] 4.5 Clean up any dead code (e.g., leftover `useEffect` data fetching or manual `router.refresh()` logic) in migrated components.
