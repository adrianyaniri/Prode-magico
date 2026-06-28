# Design: React Query Migration for Single Source of Truth

## Technical Approach

We will migrate the application to use `@tanstack/react-query` for all client-side data fetching and mutation state management. Server components will continue to fetch data for the initial render and SEO, but will pass this data to client components as `initialData` to seed the React Query cache. We will update the `PredictionForm` (and other mutation forms) to use `useMutation` for score updates, leveraging React Query's `onMutate` for optimistic updates, and enforce offline blocking by checking network status before execution. The Serwist service worker will be configured to exclude RSC and API payloads from its runtime caching, allowing React Query to handle data caching and revalidation logic (like refetch on focus/reconnect).

## Architecture Decisions

### Decision: Global QueryClient Provider Location
**Choice**: Create a new `ReactQueryProvider` client component and render it inside the existing `Providers` component in `src/app/layout.tsx`.
**Alternatives considered**: Wrapping the entire layout directly with `QueryClientProvider`.
**Rationale**: `QueryClientProvider` requires a client boundary (`"use client"`). The app already has a `Providers.tsx` client component that wraps `children`. We will nest `ReactQueryProvider` within it to keep the provider logic centralized without converting `layout.tsx` to a client component.

### Decision: Hydration Strategy
**Choice**: Use `initialData` passed from Server Components to Client Components' `useQuery` hooks.
**Alternatives considered**: Using React Query's `<HydrationBoundary>` with `dehydrate(queryClient)`.
**Rationale**: The app's data flow is relatively straightforward (Server Components pass data like `existingPrediction` to `PredictionForm`). Using `initialData` avoids the overhead of serializing/deserializing the entire query client state and keeps the component API simple and aligned with the current prop-drilling pattern for initial state.

### Decision: Service Worker Caching Exclusions
**Choice**: Configure Serwist `runtimeCaching` to explicitly exclude Next.js App Router RSC requests (typically `_rsc` search params or `RSC` headers) and API routes from `defaultCache`.
**Alternatives considered**: Completely disabling Serwist runtime caching.
**Rationale**: We still want Serwist to cache static assets, images, and the offline fallback shell. We only need to prevent it from aggressively caching RSC payloads, which causes stale data and conflicts with React Query.

### Decision: Offline Mutation Blocking
**Choice**: Check `navigator.onLine` inside the `onMutate` or `mutationFn` callback of `useMutation` and throw an error to block execution if offline.
**Alternatives considered**: Using React Query's `networkMode: 'offlineFirst'` and a background sync queue.
**Rationale**: The spec explicitly requires blocking mutation attempts when offline, rather than queuing them. A simple check and error throw provides immediate feedback to the user and avoids complex background sync reconciliation.

## Data Flow

    Server Component (page.tsx) ── fetches initial data ──→ Client Component (PredictionForm)
                                                                   │ (receives as initialData)
                                                                   ▼
                                                           React Query Cache
                                                                   │ (useQuery / useMutation)
                                                                   ▼
                                                           Supabase Database (Network)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/ReactQueryProvider.tsx` | Create | Initializes `QueryClient` and wraps children with `QueryClientProvider`. |
| `src/components/Providers.tsx` | Modify | Wrap its children inside `<ReactQueryProvider>`. |
| `src/app/sw.ts` | Modify | Update `runtimeCaching` to exclude RSC payloads (e.g. `?_rsc=`) and Supabase API calls. |
| `src/components/PredictionForm.tsx` | Modify | Replace `router.refresh()` with `useMutation`, implement optimistic updates, and add offline blocking. |
| `src/components/BonusPredictionsCard.tsx` | Modify | Update to use `useMutation` with optimistic updates and offline blocking. |
| `package.json` | Modify | Add `@tanstack/react-query` and `@tanstack/react-query-devtools` as dependencies. |

## Interfaces / Contracts

```typescript
// Query keys pattern
const queryKeys = {
  predictions: (userId: string) => ['predictions', userId] as const,
  matchPrediction: (userId: string, matchId: number) => ['predictions', userId, matchId] as const,
};

// Example Mutation Setup for PredictionForm
const mutation = useMutation({
  mutationFn: async (newPrediction: Prediction) => {
    if (!navigator.onLine) throw new Error("No podés guardar sin conexión.");
    // Supabase upsert logic...
  },
  onMutate: async (newPrediction) => {
    // Cancel any outgoing refetches so they don't overwrite optimistic update
    await queryClient.cancelQueries({ queryKey: queryKeys.matchPrediction(userId, matchId) });
    // Snapshot previous value
    const previous = queryClient.getQueryData(queryKeys.matchPrediction(userId, matchId));
    // Optimistically update to the new value
    queryClient.setQueryData(queryKeys.matchPrediction(userId, matchId), newPrediction);
    return { previous };
  },
  onError: (err, newPrediction, context) => {
    // Revert optimistic update
    queryClient.setQueryData(queryKeys.matchPrediction(userId, matchId), context?.previous);
  },
  onSettled: () => {
    // Invalidate query to refetch fresh data
    queryClient.invalidateQueries({ queryKey: queryKeys.matchPrediction(userId, matchId) });
  }
});
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `sw.ts` caching logic | Verify Serwist config correctly ignores RSC requests. |
| Integration | `PredictionForm` offline behavior | Mock `navigator.onLine` to `false` and verify mutation is blocked and error shown. |
| Integration | Optimistic updates | Verify UI updates instantly before network resolves, and reverts on simulated network failure. |

## Migration / Rollout

No database migration required. Rollout involves deploying the new client-side architecture. If issues arise, we can rollback to the previous commit utilizing `router.refresh()` and the original Serwist config.

## Open Questions

- [ ] Should we also convert `LeaderboardTable` and `GroupStandings` to use `useQuery` for background refetching (polling or focus-based), or rely on manual refresh/sync buttons?
