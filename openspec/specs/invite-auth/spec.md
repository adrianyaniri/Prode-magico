# Invite Auth Specification

## Purpose

Handle invite code validation, Supabase Auth email/password registration, and admin role assignment for the WC2026 prode pool. Only invited users can register.

## Requirements

### Requirement: Invite Code Validation

The system MUST validate invite codes against the `invite_codes` table before allowing registration. Used codes MUST be marked as consumed and MUST NOT be reusable. Invalid or consumed codes MUST reject registration.

#### Scenario: Registration with valid invite code

- GIVEN an unused invite code `PRODE2026` exists in `invite_codes` with `max_uses > uses_count`
- WHEN a user submits email/password with that invite code
- THEN the system creates a Supabase Auth user
- AND marks the code as consumed (`uses_count += 1`)
- AND redirects to the matches page

#### Scenario: Registration with invalid invite code

- GIVEN an invite code `FAKECODE` does not exist in `invite_codes`
- WHEN a user submits registration with that code
- THEN the system returns a validation error "Invalid invite code"
- AND no Auth user is created

#### Scenario: Registration with consumed invite code

- GIVEN a code with `uses_count >= max_uses`
- WHEN a user submits registration with that code
- THEN the system returns an error "Invite code already used"
- AND no Auth user is created

### Requirement: Admin Role Assignment

The system MUST assign the `admin` role to users who register with invite code `ADMIN2026`. All other valid codes MUST assign the `participant` role. Roles MUST be stored in a `user_roles` table referenced by the Auth user ID.

#### Scenario: Admin registration with ADMIN2026

- GIVEN a user submits the invite code `ADMIN2026`
- WHEN registration succeeds
- THEN the user receives `role = 'admin'` in `user_roles`
- AND the user can access admin routes

#### Scenario: Friend registration with PRODE2026

- GIVEN a user submits the invite code `PRODE2026`
- WHEN registration succeeds
- THEN the user receives `role = 'participant'` in `user_roles`
- AND the user cannot access admin routes

#### Scenario: Duplicate email rejection

- GIVEN a user with email `user@example.com` already registered
- WHEN another user attempts registration with the same email
- THEN Supabase Auth returns a duplicate-email error
- AND the invite code is NOT consumed
