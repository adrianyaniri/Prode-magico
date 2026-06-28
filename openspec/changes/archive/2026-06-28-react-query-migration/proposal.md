# Proposal: React Query Migration for Single Source of Truth

## Intent

Fragmented data fetching (Server Components vs local state + `router.refresh()` vs `useEffect`) and stale data caused by Serwist PWA service worker caching RSC payloads is creating synchronization bugs and poor UX. We need to unify data fetching by migrating to React Query as the single source of truth on the client. Server Components will continue to seed initial data for SEO and performance, but React Query will handle subsequent updates, caching, and mutation state, significantly improving the app's offline capabilities and optimistic UI for the WC2026 timeline.

## Scope

### In Scope
- Migrate data fetching to React Query (using `@tanstack/react-query`).
- Hydrate React Query cache from Next.js Server Components on initial load.
- Implement optimistic updates for prediction mutations.
- Disable/block mutation execution when the app is offline.
- Rely on React Query's default `refetchOnWindowFocus` and `refetchOnReconnect` for sync.
- Adjust Serwist PWA caching to avoid aggressive RSC payload caching that conflicts with React Query.

### Out of Scope
- Implementing WebSockets or Supabase Realtime for real-time synchronization.
- Complex background sync queues for offline mutations (mutations are explicitly blocked offline).
- Migrating authentication state (handled by Supabase auth).

## Capabilities

### New Capabilities
- `data-fetching`: Centralized client-side state management and fetching using React Query, supporting SSR hydration and offline reads.

### Modified Capabilities
- `predictions`: Adding optimistic updates for saves and blocking mutation attempts when offline.
- `pwa-setup`: Adjusting service worker caching strategies to prevent stale RSC payload issues and defer API caching to React Query.

## Approach

We will install `@tanstack/react-query` and configure a global `QueryClient` provider. Initial page loads will fetch data via Server Components and pass it to Client Components as `initialData` to seed the query cache. All subsequent reads and writes will go through React Query hooks (`useQuery`, `useMutation`).
For mutations like saving a prediction, we will implement `onMutate` to perform optimistic updates on the cache. We will check network status before allowing mutations. We will also clean up the Serwist service worker config to stop caching RSC data, relying on React Query's cache and default behaviors (refetch on focus/reconnect) for freshness.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/` | Modified | Add global `QueryClientProvider` to root layout. |
| `src/components/` | Modified | Update UI components to use `useQuery` / `useMutation`. |
| `src/app/sw.ts` | Modified | Update Serwist caching rules to exclude RSC payloads. |
| `package.json` | Modified | Add `@tanstack/react-query` dependencies. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Serwist cache conflicting with React Query | Medium | Thoroughly test offline/online transitions and explicitly ignore RSC endpoints in Serwist. |
| Hydration mismatches between SSR and Client | Low | Use proper `initialData` pattern and ensure consistent keys. |

## Rollback Plan

If critical syncing issues occur, we will revert the PR, roll back to the `router.refresh()` approach, and restore the previous Serwist caching rules until the React Query hydration flow is stabilized.

## Dependencies

- `@tanstack/react-query`
- `@tanstack/react-query-devtools` (optional for dev)

## Success Criteria

- [ ] Users see instant optimistic feedback when saving a prediction.
- [ ] Users can read data while offline using cached data.
- [ ] Users are prevented from submitting predictions when offline.
- [ ] Data correctly refreshes on window focus and network reconnect.
- [ ] No stale RSC payloads served by the service worker.
