-- Star Cocktail prototype database schema.
-- Run this in Supabase SQL Editor before enabling the online leaderboard.
-- It uses dedicated table names to avoid conflicts with any existing `players` or `game_results` tables:
--   public.starlight_players
--   public.starlight_game_results
-- This is intentionally permissive for a public prototype using a publishable key.
-- Before production, replace the write policies with authenticated user checks or Edge Functions.

create extension if not exists pgcrypto;

create table if not exists public.starlight_players (
  id uuid primary key default gen_random_uuid(),
  guest_key text not null unique,
  display_name text not null default '游客',
  phone text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint starlight_players_display_name_len check (char_length(display_name) between 1 and 16),
  constraint starlight_players_phone_len check (phone is null or char_length(phone) between 6 and 20)
);

with duplicate_names as (
  select
    id,
    display_name,
    row_number() over (partition by lower(display_name) order by created_at, id) as duplicate_rank
  from public.starlight_players
)
update public.starlight_players as players
set display_name = left(duplicate_names.display_name, 11) || '#' || left(replace(players.id::text, '-', ''), 4)
from duplicate_names
where players.id = duplicate_names.id
  and duplicate_names.duplicate_rank > 1;

create unique index if not exists starlight_players_display_name_lower_unique
  on public.starlight_players (lower(display_name));

create table if not exists public.starlight_game_results (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.starlight_players(id) on delete cascade,
  score integer not null default 0,
  best_cup_level integer not null default 1,
  best_cup_name text not null default '蓝星',
  full_count integer not null default 0,
  best_combo integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint starlight_game_results_score_nonnegative check (score >= 0),
  constraint starlight_game_results_best_cup_range check (best_cup_level between 1 and 14)
);

alter table public.starlight_game_results
  add column if not exists updated_at timestamptz not null default now();

create index if not exists starlight_game_results_score_rank_idx
  on public.starlight_game_results (score desc, best_cup_level desc, created_at desc);

create index if not exists starlight_game_results_cup_rank_idx
  on public.starlight_game_results (best_cup_level desc, score desc, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists starlight_players_set_updated_at on public.starlight_players;
create trigger starlight_players_set_updated_at
before update on public.starlight_players
for each row execute function public.set_updated_at();

drop trigger if exists starlight_game_results_set_updated_at on public.starlight_game_results;
create trigger starlight_game_results_set_updated_at
before update on public.starlight_game_results
for each row execute function public.set_updated_at();

alter table public.starlight_players enable row level security;
alter table public.starlight_game_results enable row level security;

drop policy if exists "public read starlight players" on public.starlight_players;
create policy "public read starlight players"
on public.starlight_players for select
using (true);

drop policy if exists "public insert starlight players" on public.starlight_players;
create policy "public insert starlight players"
on public.starlight_players for insert
with check (true);

drop policy if exists "public update starlight players" on public.starlight_players;
create policy "public update starlight players"
on public.starlight_players for update
using (true)
with check (true);

drop policy if exists "public read starlight game results" on public.starlight_game_results;
create policy "public read starlight game results"
on public.starlight_game_results for select
using (true);

drop policy if exists "public insert starlight game results" on public.starlight_game_results;
create policy "public insert starlight game results"
on public.starlight_game_results for insert
with check (true);

drop policy if exists "public update starlight game results" on public.starlight_game_results;
create policy "public update starlight game results"
on public.starlight_game_results for update
using (true)
with check (true);
