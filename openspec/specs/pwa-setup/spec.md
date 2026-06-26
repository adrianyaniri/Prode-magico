# PWA Setup Specification

## Purpose

Configure the app as a progressive web application with manifest, service worker via Serwist, install prompt, and offline shell. Must work on mobile browsers (Chrome, Safari) with a 375px viewport target.

## Requirements

### Requirement: Web App Manifest

The app MUST serve a valid `manifest.json` with: app name "Prode WC2026", short name "Prode26", theme color `#1e1e2e` (dark), background color `#111118`, display `standalone`, and icons for 192x192 and 512x512.

#### Scenario: Manifest serves correctly

- GIVEN a browser requests `/manifest.json`
- WHEN the manifest is returned
- THEN it contains all required fields
- AND the display mode is `standalone`

### Requirement: Service Worker with Serwist

The app MUST register a Serwist-based service worker at build time. The service worker MUST precache all static assets and enable runtime caching for API routes. It MUST handle navigation requests by serving the offline shell when the network is unavailable.

#### Scenario: Service worker registration

- GIVEN the app loads in a supported browser
- WHEN the page finishes loading
- THEN the service worker is registered
- AND precaching begins for static assets

#### Scenario: Offline navigation shell

- GIVEN the user navigates to any app route
- WHEN the network is unavailable
- THEN the service worker serves the offline shell page
- AND the shell displays "You are offline" with the app logo

### Requirement: Install Prompt

The app MUST support the beforeinstallprompt event on supported browsers. The system SHOULD prompt the user to install after they visit 2+ pages or spend 30+ seconds on the app.

#### Scenario: Install prompt appears

- GIVEN a user on a supported browser has visited 2 pages
- WHEN the install criteria are met
- THEN the browser fires `beforeinstallprompt`
- AND a custom "Install App" button appears in the UI

#### Scenario: Install on iOS Safari

- GIVEN a user on iOS Safari
- WHEN viewing the app
- THEN the manifest and meta tags enable "Add to Home Screen"
- AND the app opens in standalone mode after installation

### Requirement: Mobile-First Layout

All pages MUST be usable at 375px viewport width. The UI MUST use responsive layouts with a dark theme. Touch targets MUST be at least 44x44px.

#### Scenario: 375px viewport renders correctly

- GIVEN the viewport is 375px wide
- WHEN any page is loaded
- THEN no horizontal scrollbar appears
- AND all interactive elements are tappable
- AND text is readable without zooming
