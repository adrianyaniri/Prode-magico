# Delta for PWA Setup

## MODIFIED Requirements

### Requirement: Service Worker with Serwist

The app MUST register a Serwist-based service worker at build time. The service worker MUST precache all static assets. The service worker MUST explicitly exclude RSC payloads and API responses from its caching strategy, deferring data caching to React Query. It MUST handle navigation requests by serving the offline shell when the network is unavailable.
(Previously: The app MUST register a Serwist-based service worker at build time. The service worker MUST precache all static assets and enable runtime caching for API routes. It MUST handle navigation requests by serving the offline shell when the network is unavailable.)

#### Scenario: Service worker registration

- GIVEN the app loads in a supported browser
- WHEN the page finishes loading
- THEN the service worker is registered
- AND precaching begins for static assets

#### Scenario: RSC payload exclusion

- GIVEN the service worker is active
- WHEN the app fetches RSC payloads or API data
- THEN the service worker bypasses these requests without caching them
- AND React Query handles the caching of the resulting data

#### Scenario: Offline navigation shell

- GIVEN the user navigates to any app route
- WHEN the network is unavailable
- THEN the service worker serves the offline shell page
- AND the shell displays "You are offline" with the app logo
