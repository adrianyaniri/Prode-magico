# Data Fetching Specification

## Purpose

Centralized client-side state management and data fetching using React Query as the single source of truth, supporting SSR hydration and offline reads.

## Requirements

### Requirement: Global QueryClient

The application MUST wrap the component tree with a global `QueryClientProvider` configured to use React Query.

#### Scenario: React Query provider initialization

- GIVEN the application is starting up
- WHEN the root layout renders
- THEN the `QueryClientProvider` is initialized and provides the `QueryClient` context to all components

### Requirement: SSR Hydration

The system MUST hydrate the React Query cache on initial page loads using data fetched by Server Components.

#### Scenario: Initial data hydration

- GIVEN a user visits a page
- WHEN the Server Component fetches data
- THEN it passes the data as `initialData` to Client Components
- AND the React Query cache is seeded with this initial data

### Requirement: React Query for Client Data

All subsequent client-side data reads MUST utilize React Query hooks (e.g., `useQuery`).

#### Scenario: Client-side data fetching

- GIVEN the user navigates to a new view client-side
- WHEN data is required
- THEN `useQuery` is used to fetch the data
- AND the data is cached by React Query

### Requirement: React Query Refetch Behaviors

The system MUST rely on React Query's default behaviors for keeping data fresh: `refetchOnWindowFocus` and `refetchOnReconnect`.

#### Scenario: Refetch on window focus

- GIVEN the user has the app open but navigated away to another tab
- WHEN the user refocuses the app tab
- THEN React Query triggers background refetches for active queries
- AND the UI is updated with the latest data

#### Scenario: Refetch on reconnect

- GIVEN the user was offline and comes back online
- WHEN the network connection is restored
- THEN React Query triggers background refetches for active queries
- AND the UI is updated with the latest data

### Requirement: Offline Data Reads

The system MUST allow users to read previously fetched data when the network is unavailable.

#### Scenario: Offline read access

- GIVEN the user is offline
- WHEN the user navigates to a previously visited page
- THEN React Query serves the data from its cache
- AND the UI renders successfully without a network error
