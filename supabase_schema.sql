-- Star Cocktail prototype database schema.
-- Run this in Supabase SQL Editor before enabling the online leaderboard.
-- This is intentionally permissive for a public prototype using a publishable key.
-- Before production, replace the write policies with authenticated user checks or Edge Functions.

create extension if not exists pgcrypto;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  guest_key text not null unique,
  display_name text not null default '游客',
  phone text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_display_name_len check (char_length(display_name) between 1 and 16),
  constraint players_phone_len check (phone is null or char_length(phone) between 6 and 20)
);

create table if not exists public.game_results (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.players(id) on delete cascade,
  score integer not null default 0,
  best_cup_level integer not null default 1,
  best_cup_name text not null default '蓝星',
  full_count integer not null default 0,
  best_combo integer not null default 0,
  created_at timestamptz not null default now(),
  constraint game_results_score_nonnegative check (score >= 0),
  constraint game_results_best_cup_range check (best_cup_level between 1 and 14)
);

create index if not exists game_results_score_rank_idx
  on public.game_results (score desc, best_cup_level desc, created_at desc);

create index if not exists game_results_cup_rank_idx
  on public.game_results (best_cup_level desc, score desc, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists players_set_updated_at on public.players;
create trigger players_set_updated_at
before update on public.players
for each row execute function public.set_updated_at();

alter table public.players enable row level security;
alter table public.game_results enable row level security;

drop policy if exists "public read players" on public.players;
create policy "public read players"
on public.players for select
using (true);

drop policy if exists "public insert players" on public.players;
create policy "public insert players"
on public.players for insert
with check (true);

drop policy if exists "public update players" on public.players;
create policy "public update players"
on public.players for update
using (true)
with check (true);

drop policy if exists "public read game results" on public.game_results;
create policy "public read game results"
on public.game_results for select
using (true);

drop policy if exists "public insert game results" on public.game_results;
create policy "public insert game results"
on public.game_results for insert
with check (true);
