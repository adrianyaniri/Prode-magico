-- Migration: Fix kickoff_at and pairings for ALL knockout rounds
-- to match FIFA's official 2026 World Cup schedule.
-- Run in Supabase SQL Editor.

-- =============================================================
-- ROUND OF 32 (Partidos 73-88)
-- Orden cronológico oficial FIFA:
-- 73: 2A vs 2B       (Dom 28 Jun)
-- 74: 1E vs 3°A/B/C/D/F  (Lun 29 Jun)
-- 75: 1F vs 2C       (Lun 29 Jun)
-- 76: 1C vs 2F       (Lun 29 Jun)
-- 77: 1I vs 3°C/D/F/G/H  (Mar 30 Jun)
-- 78: 2E vs 2I       (Mar 30 Jun)
-- 79: 1A vs 3°C/E/F/H/I  (Mar 30 Jun)
-- 80: 1L vs 3°E/H/I/J/K  (Mié 1 Jul)
-- 81: 1D vs 3°B/E/F/I/J  (Mié 1 Jul)
-- 82: 1G vs 3°A/E/H/I/J  (Mié 1 Jul)
-- 83: 2K vs 2L       (Jue 2 Jul)
-- 84: 1H vs 2J       (Jue 2 Jul)
-- 85: 1B vs 3°E/F/G/I/J  (Jue 2 Jul)
-- 86: 1J vs 2H       (Vie 3 Jul)
-- 87: 1K vs 3°D/E/I/J/L  (Vie 3 Jul)
-- 88: 2D vs 2G       (Vie 3 Jul)

-- We identify matches by their current home_team + away_team + round_name
-- (before the bracket calculator runs and updates team names)

-- Partido 73: 2A vs 2B
UPDATE public.matches
SET kickoff_at = '2026-06-28 21:00+00',
    home_team = '2A',
    away_team = '2B'
WHERE round_name = 'Round of 32'
  AND kickoff_at = '2026-06-28 13:00+00'
  AND home_team = '1A';

-- Partido 74: 1E vs 3°A/B/C/D/F
UPDATE public.matches
SET kickoff_at = '2026-06-29 16:00+00',
    home_team = '1E',
    away_team = '3A/B/C/D/F'
WHERE round_name = 'Round of 32'
  AND kickoff_at = '2026-06-28 16:00+00'
  AND home_team = '2B';

-- Partido 75: 1F vs 2C
UPDATE public.matches
SET kickoff_at = '2026-06-29 19:00+00',
    home_team = '1F',
    away_team = '2C'
WHERE round_name = 'Round of 32'
  AND kickoff_at = '2026-06-28 19:00+00'
  AND home_team = '1C';

-- Partido 76: 1C vs 2F
UPDATE public.matches
SET kickoff_at = '2026-06-29 22:00+00',
    home_team = '1C',
    away_team = '2F'
WHERE round_name = 'Round of 32'
  AND kickoff_at = '2026-06-28 22:00+00'
  AND home_team = '2D';

-- Partido 77: 1I vs 3°C/D/F/G/H
UPDATE public.matches
SET kickoff_at = '2026-06-30 16:00+00',
    home_team = '1I',
    away_team = '3C/D/F/G/H'
WHERE round_name = 'Round of 32'
  AND kickoff_at = '2026-06-29 13:00+00'
  AND home_team = '1E';

-- Partido 78: 2E vs 2I
UPDATE public.matches
SET kickoff_at = '2026-06-30 19:00+00',
    home_team = '2E',
    away_team = '2I'
WHERE round_name = 'Round of 32'
  AND kickoff_at = '2026-06-29 16:00+00'
  AND home_team = '2F';

-- Partido 79: 1A vs 3°C/E/F/H/I
UPDATE public.matches
SET kickoff_at = '2026-06-30 22:00+00',
    home_team = '1A',
    away_team = '3C/E/F/H/I'
WHERE round_name = 'Round of 32'
  AND kickoff_at = '2026-06-29 19:00+00'
  AND home_team = '1G';

-- Partido 80: 1L vs 3°E/H/I/J/K
UPDATE public.matches
SET kickoff_at = '2026-07-01 16:00+00',
    home_team = '1L',
    away_team = '3E/H/I/J/K'
WHERE round_name = 'Round of 32'
  AND kickoff_at = '2026-06-29 22:00+00'
  AND home_team = '2H';

-- Partido 81: 1D vs 3°B/E/F/I/J
UPDATE public.matches
SET kickoff_at = '2026-07-01 19:00+00',
    home_team = '1D',
    away_team = '3B/E/F/I/J'
WHERE round_name = 'Round of 32'
  AND kickoff_at = '2026-06-30 13:00+00'
  AND home_team = '1I';

-- Partido 82: 1G vs 3°A/E/H/I/J
UPDATE public.matches
SET kickoff_at = '2026-07-01 22:00+00',
    home_team = '1G',
    away_team = '3A/E/H/I/J'
WHERE round_name = 'Round of 32'
  AND kickoff_at = '2026-06-30 16:00+00'
  AND home_team = '2J';

-- Partido 83: 2K vs 2L
UPDATE public.matches
SET kickoff_at = '2026-07-02 16:00+00',
    home_team = '2K',
    away_team = '2L'
WHERE round_name = 'Round of 32'
  AND kickoff_at = '2026-06-30 19:00+00'
  AND home_team = '1K';

-- Partido 84: 1H vs 2J
UPDATE public.matches
SET kickoff_at = '2026-07-02 19:00+00',
    home_team = '1H',
    away_team = '2J'
WHERE round_name = 'Round of 32'
  AND kickoff_at = '2026-06-30 22:00+00'
  AND home_team = '2L';

-- Partido 85: 1B vs 3°E/F/G/I/J
UPDATE public.matches
SET kickoff_at = '2026-07-02 22:00+00',
    home_team = '1B',
    away_team = '3E/F/G/I/J'
WHERE round_name = 'Round of 32'
  AND kickoff_at = '2026-07-01 13:00+00'
  AND home_team = '1B';

-- Partido 86: 1J vs 2H
UPDATE public.matches
SET kickoff_at = '2026-07-03 16:00+00',
    home_team = '1J',
    away_team = '2H'
WHERE round_name = 'Round of 32'
  AND kickoff_at = '2026-07-01 16:00+00'
  AND home_team = '2C';

-- Partido 87: 1K vs 3°D/E/I/J/L
UPDATE public.matches
SET kickoff_at = '2026-07-03 19:00+00',
    home_team = '1K',
    away_team = '3D/E/I/J/L'
WHERE round_name = 'Round of 32'
  AND kickoff_at = '2026-07-01 19:00+00'
  AND home_team = '1D';

-- Partido 88: 2D vs 2G
UPDATE public.matches
SET kickoff_at = '2026-07-03 22:00+00',
    home_team = '2D',
    away_team = '2G'
WHERE round_name = 'Round of 32'
  AND kickoff_at = '2026-07-01 22:00+00'
  AND home_team = '2A';

-- =============================================================
-- ROUND OF 16
-- W49-W64 correspond to winners of Partidos 73-88 respectively.
-- FIFA R16 schedule (Partidos 89-96):
-- 89: W49 vs W50   (Lun 30 Jun)
-- 90: W51 vs W52   (Mar 1 Jul)
-- 91: W53 vs W54   (Mié 2 Jul)
-- 92: W55 vs W56   (Jue 3 Jul)
-- 93: W57 vs W58   (Vie 4 Jul)
-- 94: W59 vs W60   (Sáb 5 Jul)
-- 95: W61 vs W62   (Dom 6 Jul)
-- 96: W63 vs W64   (Lun 7 Jul)

UPDATE public.matches
SET kickoff_at = '2026-06-30 21:00+00'
WHERE round_name = 'Round of 16' AND kickoff_at = '2026-07-02 13:00+00';

UPDATE public.matches
SET kickoff_at = '2026-07-01 21:00+00'
WHERE round_name = 'Round of 16' AND kickoff_at = '2026-07-02 16:00+00';

UPDATE public.matches
SET kickoff_at = '2026-07-02 21:00+00'
WHERE round_name = 'Round of 16' AND kickoff_at = '2026-07-02 19:00+00';

UPDATE public.matches
SET kickoff_at = '2026-07-03 21:00+00'
WHERE round_name = 'Round of 16' AND kickoff_at = '2026-07-02 22:00+00';

UPDATE public.matches
SET kickoff_at = '2026-07-04 21:00+00'
WHERE round_name = 'Round of 16' AND kickoff_at = '2026-07-03 13:00+00';

UPDATE public.matches
SET kickoff_at = '2026-07-05 21:00+00'
WHERE round_name = 'Round of 16' AND kickoff_at = '2026-07-03 16:00+00';

UPDATE public.matches
SET kickoff_at = '2026-07-06 21:00+00'
WHERE round_name = 'Round of 16' AND kickoff_at = '2026-07-03 19:00+00';

UPDATE public.matches
SET kickoff_at = '2026-07-07 21:00+00'
WHERE round_name = 'Round of 16' AND kickoff_at = '2026-07-03 22:00+00';

-- =============================================================
-- QUARTER-FINALS (Partidos 97-100)
UPDATE public.matches
SET kickoff_at = '2026-07-09 21:00+00'
WHERE round_name = 'Quarter-finals' AND kickoff_at = '2026-07-06 13:00+00';

UPDATE public.matches
SET kickoff_at = '2026-07-10 21:00+00'
WHERE round_name = 'Quarter-finals' AND kickoff_at = '2026-07-06 16:00+00';

UPDATE public.matches
SET kickoff_at = '2026-07-11 21:00+00'
WHERE round_name = 'Quarter-finals' AND kickoff_at = '2026-07-07 13:00+00';

UPDATE public.matches
SET kickoff_at = '2026-07-12 21:00+00'
WHERE round_name = 'Quarter-finals' AND kickoff_at = '2026-07-07 16:00+00';

-- =============================================================
-- SEMI-FINALS (Partidos 101-102)
UPDATE public.matches
SET kickoff_at = '2026-07-14 21:00+00'
WHERE round_name = 'Semi-finals' AND kickoff_at = '2026-07-10 17:00+00';

UPDATE public.matches
SET kickoff_at = '2026-07-15 21:00+00'
WHERE round_name = 'Semi-finals' AND kickoff_at = '2026-07-11 17:00+00';

-- =============================================================
-- THIRD PLACE (Partido 103)
UPDATE public.matches
SET kickoff_at = '2026-07-18 21:00+00'
WHERE round_name = 'Third Place' AND kickoff_at = '2026-07-13 17:00+00';

-- =============================================================
-- FINAL (Partido 104)
UPDATE public.matches
SET kickoff_at = '2026-07-19 21:00+00'
WHERE round_name = 'Final' AND kickoff_at = '2026-07-14 18:00+00';
