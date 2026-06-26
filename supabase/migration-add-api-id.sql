-- Migration: Add api_id to matches + create group_standings
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Add api_id column (nullable until repopulated)
ALTER TABLE public.matches
ADD COLUMN api_id INTEGER UNIQUE;

-- 2. Create group_standings table
CREATE TABLE IF NOT EXISTS public.group_standings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  group_name TEXT NOT NULL,
  position INTEGER NOT NULL,
  team TEXT NOT NULL,
  played INTEGER NOT NULL DEFAULT 0,
  won INTEGER NOT NULL DEFAULT 0,
  draw INTEGER NOT NULL DEFAULT 0,
  lost INTEGER NOT NULL DEFAULT 0,
  goals_for INTEGER NOT NULL DEFAULT 0,
  goals_against INTEGER NOT NULL DEFAULT 0,
  goal_difference INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_name, position)
);

-- Enable RLS but allow read for authenticated users
ALTER TABLE public.group_standings ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read
CREATE POLICY "Authenticated users can read group_standings"
  ON public.group_standings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service_role (admin) can write
CREATE POLICY "Service role can manage group_standings"
  ON public.group_standings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_matches_api_id ON public.matches(api_id);
CREATE INDEX IF NOT EXISTS idx_group_standings_group ON public.group_standings(group_name);

-- 4. Create function to get standings for a group
CREATE OR REPLACE FUNCTION get_group_standings(group_name_param TEXT)
RETURNS TABLE(
  position INTEGER,
  team TEXT,
  played INTEGER,
  won INTEGER,
  draw INTEGER,
  lost INTEGER,
  goals_for INTEGER,
  goals_against INTEGER,
  goal_difference INTEGER,
  points INTEGER
) LANGUAGE SQL STABLE AS $$
  SELECT position, team, played, won, draw, lost,
         goals_for, goals_against, goal_difference, points
  FROM public.group_standings
  WHERE group_name = group_name_param
  ORDER BY position;
$$;
