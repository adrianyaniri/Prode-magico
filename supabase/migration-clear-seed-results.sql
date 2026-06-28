-- Clear all hardcoded seed results from the matches table.
-- The only source of truth for results is the football-data.org API.
-- Run this before the first sync on any existing database.

update public.matches set home_score = null, away_score = null, penalty_winner = null
where home_score is not null or away_score is not null;

-- Also clear group standings since they need to be recalculated from real results
delete from public.group_standings;
