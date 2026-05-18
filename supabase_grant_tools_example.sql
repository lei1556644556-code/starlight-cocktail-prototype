-- Run this in Supabase SQL Editor to grant tools to a player by nickname.
-- This example grants player "雷鑫2" +10 trash tools and +10 tongs tools.

insert into public.starlight_player_inventory (player_id, trash_pending, tongs_pending)
select id, 10, 10
from public.starlight_players
where display_name = '雷鑫2'
on conflict (player_id) do update set
  trash_pending = public.starlight_player_inventory.trash_pending + excluded.trash_pending,
  tongs_pending = public.starlight_player_inventory.tongs_pending + excluded.tongs_pending,
  updated_at = now();
