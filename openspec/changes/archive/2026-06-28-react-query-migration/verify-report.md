## Verification Report

**Change**: react-query-migration
**Version**: N/A
**Mode**: Standard

---

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 16 |
| Tasks complete | 16 |
| Tasks incomplete | 0 |

---

### Build & Tests Execution

**Build**: ❌ Failed
```
./src/components/BonusPredictionsCard.tsx:79:44
Type error: Spread types may only be created from object types.

  77 |       await queryClient.cancelQueries({ queryKey });
  78 |       const previous = queryClient.getQueryData(queryKey);
> 79 |       queryClient.setQueryData(queryKey, { ...previous, ...newBonus });
     |                                            ^
  80 |       return { previous };
  81 |     },
  82 |     onError: (err, newBonus, context) => {
Next.js build worker exited with code: 1 and signal: null
```

**Tests**: ⚠️ Not configured (No test runner detected)
```
No test runner configured. Run npm test once a runner is installed.
```

**Coverage**: ➖ Not available

---

### Spec Compliance Matrix

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| React Query provider initialization | React Query provider initialization | (none found) | ❌ UNTESTED |
| SSR Hydration | Initial data hydration | (none found) | ❌ UNTESTED |
| React Query for Client Data | Client-side data fetching | (none found) | ❌ UNTESTED |
| React Query Refetch Behaviors | Refetch on window focus | (none found) | ❌ UNTESTED |
| React Query Refetch Behaviors | Refetch on reconnect | (none found) | ❌ UNTESTED |
| Offline Data Reads | Offline read access | (none found) | ❌ UNTESTED |
| Offline Mutation Blocking | Offline mutation attempt | (none found) | ❌ UNTESTED |
| Submit Prediction | Happy path — submit prediction | (none found) | ❌ UNTESTED |
| Submit Prediction | Submit prediction network failure | (none found) | ❌ UNTESTED |
| Update Prediction Before Kickoff | Update existing prediction | (none found) | ❌ UNTESTED |
| Update Prediction Before Kickoff | Update prediction network failure | (none found) | ❌ UNTESTED |
| Service Worker with Serwist | Service worker registration | (none found) | ❌ UNTESTED |
| Service Worker with Serwist | RSC payload exclusion | (none found) | ❌ UNTESTED |
| Service Worker with Serwist | Offline navigation shell | (none found) | ❌ UNTESTED |

**Compliance summary**: 0/14 scenarios compliant (No tests implemented)

---

### Correctness (Static — Structural Evidence)
| Requirement | Status | Notes |
|------------|--------|-------|
| React Query provider initialization | ✅ Implemented | `ReactQueryProvider` created and wraps `Providers.tsx` |
| SSR Hydration | ✅ Implemented | `initialData` used in `useQuery` for LeaderboardTable and GroupStandings |
| React Query for Client Data | ✅ Implemented | Switched to `useQuery` in components |
| React Query Refetch Behaviors | ✅ Implemented | Default options configured correctly in `ReactQueryProvider` |
| Offline Data Reads | ✅ Implemented | Handled by React Query cache defaults |
| Offline Mutation Blocking | ✅ Implemented | Explicit `navigator.onLine` checks added in mutation fns |
| Submit/Update Prediction | ✅ Implemented | Optimistic updates added via `onMutate` |
| Service Worker with Serwist | ✅ Implemented | Custom `runtimeCaching` matcher implemented in `sw.ts` |

---

### Coherence (Design)
| Decision | Followed? | Notes |
|----------|-----------|-------|
| Global QueryClient Provider Location | ✅ Yes | Rendered inside existing `Providers` |
| Hydration Strategy | ✅ Yes | Uses `initialData` |
| Service Worker Caching Exclusions | ✅ Yes | Properly excludes RSC/API via NetworkOnly |
| Offline Mutation Blocking | ✅ Yes | Uses `navigator.onLine` check |

---

### Issues Found

**CRITICAL** (must fix before archive):
- Build fails due to a TypeScript error in `BonusPredictionsCard.tsx` (and potentially `PredictionForm.tsx`). `previous` value returned from `queryClient.getQueryData()` is `unknown` and may be `undefined`, making the spread operator `{ ...previous, ...newBonus }` invalid. 

**WARNING** (should fix):
- No automated tests implemented for React Query offline integration or optimistic updates.

**SUGGESTION** (nice to have):
- Add explicit type assertions or default empty objects when spreading `previous` state in optimistic updates, e.g. `{ ...(previous || {}), ...newBonus }`.

---

### Verdict
FAIL

Build failed with a TypeScript compilation error in optimistic update logic.
