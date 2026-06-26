# Admin Panel Specification

## Purpose

Provide admin-only routes for managing invite codes, entering match results, and viewing an overview dashboard. All routes MUST be protected by admin role check and return 403 for non-admins.

## Requirements

### Requirement: Route Protection

All admin panel routes (`/admin/*`) MUST verify the current user has `role = 'admin'` in `user_roles`. Non-admin users MUST be redirected or receive a 403 response. Unauthenticated users MUST receive a 401 response.

#### Scenario: Admin accesses admin panel

- GIVEN a user with `role = 'admin'`
- WHEN they navigate to `/admin`
- THEN the admin dashboard renders

#### Scenario: Non-admin blocked from admin panel

- GIVEN a user with `role = 'participant'`
- WHEN they navigate to `/admin`
- THEN the system returns a 403 or redirects to `/matches`

### Requirement: Invite Code Management

The admin MUST be able to view all invite codes, create new codes with custom `max_uses`, and see usage count per code. The code value SHOULD be auto-generated unless the admin specifies one.

#### Scenario: Create invite code

- GIVEN the admin is on the invite codes page
- WHEN the admin sets `max_uses = 5` and clicks Generate
- THEN a new code is inserted into `invite_codes`
- AND the code appears in the table with 0 uses

#### Scenario: View invite code usage

- GIVEN multiple invite codes with different use counts
- WHEN viewing the invite codes table
- THEN each row shows: code value, max_uses, current uses, created date

### Requirement: Match Result Entry

The admin MUST be able to enter or update scores for any match. On save, the scoring engine runs automatically. Result entry includes: home score, away score, and optional notes.

#### Scenario: Enter match result

- GIVEN the admin selects a match and enters home score 2, away score 1
- WHEN they click Save Result
- THEN the match score is saved to the database
- AND the scoring engine recalculates points for that match

#### Scenario: Update existing result

- GIVEN a match has score 2-1 and the admin changes it to 3-0
- WHEN they click Save Result
- THEN the match score is updated
- AND all predictions for that match are re-scored
