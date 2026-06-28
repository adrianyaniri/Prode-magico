-- =============================================================
-- Schema: MVP Prode — WC2026 Prediction Pool
-- Run this in Supabase SQL Editor
-- =============================================================

-- 0. Extensions
create extension if not exists "pgcrypto";

-- 1. Tables

create table if not exists public.matches (
  id serial primary key,
  home_team text not null,
  away_team text not null,
  round_name text not null check (round_name in (
    'Group Stage', 'Round of 32', 'Round of 16',
    'Quarter-finals', 'Semi-finals', 'Third Place', 'Final'
  )),
  group_name text check (group_name ~ '^[A-L]$'),
  kickoff_at timestamptz not null,
  home_score int check (home_score >= 0),
  away_score int check (away_score >= 0),
  penalty_winner text check (penalty_winner in (home_team, away_team) or penalty_winner is null),
  created_at timestamptz default now()
);

create table if not exists public.predictions (
  id serial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id int not null references public.matches(id) on delete cascade,
  home_score int not null check (home_score >= 0),
  away_score int not null check (away_score >= 0),
  points int check (points >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, match_id)
);

create table if not exists public.invite_codes (
  id serial primary key,
  code text not null unique,
  max_uses int not null default 1 check (max_uses > 0),
  uses_count int not null default 0 check (uses_count >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  check (uses_count <= max_uses)
);

create table if not exists public.user_roles (
  id serial primary key,
  user_id uuid not null references auth.users(id) on delete cascade unique,
  role text not null check (role in ('admin', 'participant')),
  created_at timestamptz default now()
);

create table if not exists public.shoutbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(message) > 0 and char_length(message) <= 150),
  created_at timestamptz default now()
);

-- RLS for shoutbox
alter table public.shoutbox enable row level security;
create policy "Anyone can read shoutbox messages" on public.shoutbox for select using (true);
create policy "Authenticated users can insert shoutbox messages" on public.shoutbox for insert with check (auth.uid() = user_id);

-- 1.5. RPC Functions

-- Increment invite code usage count (called after successful registration)
create or replace function public.increment_invite_uses(code_text text)
returns void
language plpgsql
security definer
as $$
begin
  update public.invite_codes
  set uses_count = uses_count + 1
  where code = code_text and uses_count < max_uses;
end;
$$;

-- Get a user's role by their auth user ID
create or replace function public.get_user_role(user_id uuid)
returns text
language sql
security definer
stable
as $$
  select role from public.user_roles where user_id = $1;
$$;

-- 2. Indexes

create index if not exists idx_predictions_user_id on public.predictions(user_id);
create index if not exists idx_predictions_match_id on public.predictions(match_id);
create index if not exists idx_predictions_user_match on public.predictions(user_id, match_id);
create index if not exists idx_matches_kickoff on public.matches(kickoff_at);
create index if not exists idx_matches_round on public.matches(round_name);

-- 3. Row-Level Security

alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.invite_codes enable row level security;
alter table public.user_roles enable row level security;

-- matches: all authenticated can read; only admin can update
drop policy if exists "matches_select_all_authenticated" on public.matches;
create policy "matches_select_all_authenticated"
  on public.matches for select
  to authenticated
  using (true);

drop policy if exists "matches_update_admin_only" on public.matches;
create policy "matches_update_admin_only"
  on public.matches for update
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- predictions: users see own rows, admin sees all
drop policy if exists "predictions_select_own_or_admin" on public.predictions;
create policy "predictions_select_own_or_admin"
  on public.predictions for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "predictions_insert_own_ko" on public.predictions;
create policy "predictions_insert_own_ko"
  on public.predictions for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.matches
      where id = match_id
      and round_name != 'Group Stage'
      and kickoff_at > now()
    )
  );

drop policy if exists "predictions_update_own_before_kickoff" on public.predictions;
create policy "predictions_update_own_before_kickoff"
  on public.predictions for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.matches
      where id = match_id
      and kickoff_at > now()
    )
  );

-- invite_codes: admin only
drop policy if exists "invite_codes_admin_all" on public.invite_codes;
create policy "invite_codes_admin_all"
  on public.invite_codes for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- user_roles: all authenticated can read
drop policy if exists "user_roles_select_all_authenticated" on public.user_roles;
create policy "user_roles_select_all_authenticated"
  on public.user_roles for select
  to authenticated
  using (true);

-- 4. Seed: Invite Codes

insert into public.invite_codes (code, max_uses, uses_count) values
  ('PRODE2026', 15, 0),
  ('ADMIN2026', 1, 0)
on conflict (code) do nothing;

-- 5. Seed: All 104 Matches

-- Group Stage: 12 groups × 6 matches = 72 matches (June 11–27)
-- Knockout: June 28+ (R32, R16, QF, SF, 3rd, Final)

-- Group A
insert into public.matches (home_team, away_team, round_name, group_name, kickoff_at) values
  ('Mexico', 'South Korea', 'Group Stage', 'A', '2026-06-11 16:00+00'),
  ('Czechia', 'South Africa', 'Group Stage', 'A', '2026-06-11 19:00+00'),
  ('Mexico', 'Czechia', 'Group Stage', 'A', '2026-06-14 13:00+00'),
  ('South Korea', 'South Africa', 'Group Stage', 'A', '2026-06-14 16:00+00'),
  ('South Korea', 'Czechia', 'Group Stage', 'A', '2026-06-18 17:00+00'),
  ('South Africa', 'Mexico', 'Group Stage', 'A', '2026-06-18 20:00+00');

-- Group B
insert into public.matches (home_team, away_team, round_name, group_name, kickoff_at) values
  ('Switzerland', 'Canada', 'Group Stage', 'B', '2026-06-12 13:00+00'),
  ('Bosnia-Herzegovina', 'Qatar', 'Group Stage', 'B', '2026-06-12 16:00+00'),
  ('Switzerland', 'Bosnia-Herzegovina', 'Group Stage', 'B', '2026-06-15 17:00+00'),
  ('Canada', 'Qatar', 'Group Stage', 'B', '2026-06-15 20:00+00'),
  ('Canada', 'Bosnia-Herzegovina', 'Group Stage', 'B', '2026-06-19 13:00+00'),
  ('Qatar', 'Switzerland', 'Group Stage', 'B', '2026-06-19 16:00+00');

-- Group C
insert into public.matches (home_team, away_team, round_name, group_name, kickoff_at) values
  ('Brazil', 'Morocco', 'Group Stage', 'C', '2026-06-12 19:00+00'),
  ('Scotland', 'Haiti', 'Group Stage', 'C', '2026-06-12 22:00+00'),
  ('Brazil', 'Scotland', 'Group Stage', 'C', '2026-06-15 13:00+00'),
  ('Morocco', 'Haiti', 'Group Stage', 'C', '2026-06-15 16:00+00'),
  ('Morocco', 'Scotland', 'Group Stage', 'C', '2026-06-19 19:00+00'),
  ('Haiti', 'Brazil', 'Group Stage', 'C', '2026-06-19 22:00+00');

-- Group D
insert into public.matches (home_team, away_team, round_name, group_name, kickoff_at) values
  ('United States', 'Australia', 'Group Stage', 'D', '2026-06-13 13:00+00'),
  ('Paraguay', 'Turkiye', 'Group Stage', 'D', '2026-06-13 16:00+00'),
  ('United States', 'Paraguay', 'Group Stage', 'D', '2026-06-16 17:00+00'),
  ('Australia', 'Turkiye', 'Group Stage', 'D', '2026-06-16 20:00+00'),
  ('Australia', 'Paraguay', 'Group Stage', 'D', '2026-06-20 13:00+00'),
  ('Turkiye', 'United States', 'Group Stage', 'D', '2026-06-20 16:00+00');

-- Group E
insert into public.matches (home_team, away_team, round_name, group_name, kickoff_at) values
  ('Germany', 'Cote d''Ivoire', 'Group Stage', 'E', '2026-06-13 19:00+00'),
  ('Ecuador', 'Curacao', 'Group Stage', 'E', '2026-06-13 22:00+00'),
  ('Germany', 'Ecuador', 'Group Stage', 'E', '2026-06-16 13:00+00'),
  ('Cote d''Ivoire', 'Curacao', 'Group Stage', 'E', '2026-06-16 16:00+00'),
  ('Cote d''Ivoire', 'Ecuador', 'Group Stage', 'E', '2026-06-20 19:00+00'),
  ('Curacao', 'Germany', 'Group Stage', 'E', '2026-06-20 22:00+00');

-- Group F
insert into public.matches (home_team, away_team, round_name, group_name, kickoff_at) values
  ('Netherlands', 'Japan', 'Group Stage', 'F', '2026-06-14 17:00+00'),
  ('Sweden', 'Tunisia', 'Group Stage', 'F', '2026-06-14 20:00+00'),
  ('Netherlands', 'Sweden', 'Group Stage', 'F', '2026-06-17 13:00+00'),
  ('Japan', 'Tunisia', 'Group Stage', 'F', '2026-06-17 16:00+00'),
  ('Japan', 'Sweden', 'Group Stage', 'F', '2026-06-21 17:00+00'),
  ('Tunisia', 'Netherlands', 'Group Stage', 'F', '2026-06-21 20:00+00');

-- Group G
insert into public.matches (home_team, away_team, round_name, group_name, kickoff_at) values
  ('Egypt', 'Iran', 'Group Stage', 'G', '2026-06-11 13:00+00'),
  ('Belgium', 'New Zealand', 'Group Stage', 'G', '2026-06-11 22:00+00'),
  ('Egypt', 'Belgium', 'Group Stage', 'G', '2026-06-14 22:00+00'),
  ('Iran', 'New Zealand', 'Group Stage', 'G', '2026-06-17 19:00+00'),
  ('Iran', 'Belgium', 'Group Stage', 'G', '2026-06-21 13:00+00'),
  ('New Zealand', 'Egypt', 'Group Stage', 'G', '2026-06-21 16:00+00');

-- Group H
insert into public.matches (home_team, away_team, round_name, group_name, kickoff_at) values
  ('Spain', 'Uruguay', 'Group Stage', 'H', '2026-06-12 17:00+00'),
  ('Cape Verde', 'Saudi Arabia', 'Group Stage', 'H', '2026-06-15 13:00+00'),
  ('Spain', 'Cape Verde', 'Group Stage', 'H', '2026-06-18 13:00+00'),
  ('Uruguay', 'Saudi Arabia', 'Group Stage', 'H', '2026-06-18 16:00+00'),
  ('Uruguay', 'Cape Verde', 'Group Stage', 'H', '2026-06-22 17:00+00'),
  ('Saudi Arabia', 'Spain', 'Group Stage', 'H', '2026-06-22 20:00+00');

-- Group I
insert into public.matches (home_team, away_team, round_name, group_name, kickoff_at) values
  ('France', 'Norway', 'Group Stage', 'I', '2026-06-13 17:00+00'),
  ('Senegal', 'Iraq', 'Group Stage', 'I', '2026-06-15 19:00+00'),
  ('France', 'Senegal', 'Group Stage', 'I', '2026-06-17 17:00+00'),
  ('Norway', 'Iraq', 'Group Stage', 'I', '2026-06-17 20:00+00'),
  ('Norway', 'Senegal', 'Group Stage', 'I', '2026-06-22 13:00+00'),
  ('Iraq', 'France', 'Group Stage', 'I', '2026-06-22 16:00+00');

-- Group J
insert into public.matches (home_team, away_team, round_name, group_name, kickoff_at) values
  ('Argentina', 'Austria', 'Group Stage', 'J', '2026-06-11 17:00+00'),
  ('Algeria', 'Jordan', 'Group Stage', 'J', '2026-06-13 20:00+00'),
  ('Argentina', 'Algeria', 'Group Stage', 'J', '2026-06-16 19:00+00'),
  ('Austria', 'Jordan', 'Group Stage', 'J', '2026-06-18 19:00+00'),
  ('Austria', 'Algeria', 'Group Stage', 'J', '2026-06-23 17:00+00'),
  ('Jordan', 'Argentina', 'Group Stage', 'J', '2026-06-23 20:00+00');

-- Group K
insert into public.matches (home_team, away_team, round_name, group_name, kickoff_at) values
  ('Colombia', 'Portugal', 'Group Stage', 'K', '2026-06-12 20:00+00'),
  ('Congo DR', 'Uzbekistan', 'Group Stage', 'K', '2026-06-14 18:00+00'),
  ('Colombia', 'Congo DR', 'Group Stage', 'K', '2026-06-18 22:00+00'),
  ('Portugal', 'Uzbekistan', 'Group Stage', 'K', '2026-06-19 17:00+00'),
  ('Portugal', 'Congo DR', 'Group Stage', 'K', '2026-06-23 13:00+00'),
  ('Uzbekistan', 'Colombia', 'Group Stage', 'K', '2026-06-23 16:00+00');

-- Group L
insert into public.matches (home_team, away_team, round_name, group_name, kickoff_at) values
  ('England', 'Ghana', 'Group Stage', 'L', '2026-06-11 20:00+00'),
  ('Croatia', 'Panama', 'Group Stage', 'L', '2026-06-14 15:00+00'),
  ('England', 'Croatia', 'Group Stage', 'L', '2026-06-17 22:00+00'),
  ('Ghana', 'Panama', 'Group Stage', 'L', '2026-06-18 14:00+00'),
  ('Ghana', 'Croatia', 'Group Stage', 'L', '2026-06-24 17:00+00'),
  ('Panama', 'England', 'Group Stage', 'L', '2026-06-24 20:00+00');

-- Round of 32 (June 28 – July 3) — FIFA 2026 official Partidos 73-88
insert into public.matches (home_team, away_team, round_name, kickoff_at) values
  ('2A', '2B',     'Round of 32', '2026-06-28 21:00+00'),
  ('1E', '3A/B/C/D/F', 'Round of 32', '2026-06-29 16:00+00'),
  ('1F', '2C',     'Round of 32', '2026-06-29 19:00+00'),
  ('1C', '2F',     'Round of 32', '2026-06-29 22:00+00'),
  ('1I', '3C/D/F/G/H', 'Round of 32', '2026-06-30 16:00+00'),
  ('2E', '2I',     'Round of 32', '2026-06-30 19:00+00'),
  ('1A', '3C/E/F/H/I', 'Round of 32', '2026-06-30 22:00+00'),
  ('1L', '3E/H/I/J/K', 'Round of 32', '2026-07-01 16:00+00'),
  ('1D', '3B/E/F/I/J', 'Round of 32', '2026-07-01 19:00+00'),
  ('1G', '3A/E/H/I/J', 'Round of 32', '2026-07-01 22:00+00'),
  ('2K', '2L',     'Round of 32', '2026-07-02 16:00+00'),
  ('1H', '2J',     'Round of 32', '2026-07-02 19:00+00'),
  ('1B', '3E/F/G/I/J', 'Round of 32', '2026-07-02 22:00+00'),
  ('1J', '2H',     'Round of 32', '2026-07-03 16:00+00'),
  ('1K', '3D/E/I/J/L', 'Round of 32', '2026-07-03 19:00+00'),
  ('2D', '2G',     'Round of 32', '2026-07-03 22:00+00');

-- Round of 16 (June 30 – July 7) — FIFA 2026 official Partidos 89-96
-- W49-W64 are winners of Partidos 73-88 respectively
insert into public.matches (home_team, away_team, round_name, kickoff_at) values
  ('W49', 'W50', 'Round of 16', '2026-06-30 21:00+00'),
  ('W51', 'W52', 'Round of 16', '2026-07-01 21:00+00'),
  ('W53', 'W54', 'Round of 16', '2026-07-02 21:00+00'),
  ('W55', 'W56', 'Round of 16', '2026-07-03 21:00+00'),
  ('W57', 'W58', 'Round of 16', '2026-07-04 21:00+00'),
  ('W59', 'W60', 'Round of 16', '2026-07-05 21:00+00'),
  ('W61', 'W62', 'Round of 16', '2026-07-06 21:00+00'),
  ('W63', 'W64', 'Round of 16', '2026-07-07 21:00+00');

-- Quarter-finals (July 9–12) — Partidos 97-100
insert into public.matches (home_team, away_team, round_name, kickoff_at) values
  ('W65', 'W66', 'Quarter-finals', '2026-07-09 21:00+00'),
  ('W67', 'W68', 'Quarter-finals', '2026-07-10 21:00+00'),
  ('W69', 'W70', 'Quarter-finals', '2026-07-11 21:00+00'),
  ('W71', 'W72', 'Quarter-finals', '2026-07-12 21:00+00');

-- Semi-finals (July 14–15) — Partidos 101-102
insert into public.matches (home_team, away_team, round_name, kickoff_at) values
  ('W73', 'W74', 'Semi-finals', '2026-07-14 21:00+00'),
  ('W75', 'W76', 'Semi-finals', '2026-07-15 21:00+00');

-- Third Place (July 18) — Partido 103
insert into public.matches (home_team, away_team, round_name, kickoff_at) values
  ('LS77', 'LS78', 'Third Place', '2026-07-18 21:00+00');

-- Final (July 19) — Partido 104
insert into public.matches (home_team, away_team, round_name, kickoff_at) values
  ('W77', 'W78', 'Final', '2026-07-19 21:00+00');

-- 6. Seed: 48 Group Matches — results removed.
-- Results come ONLY from the football-data.org API via sync-results.
-- Run the sync endpoint after seeding to populate real scores.
