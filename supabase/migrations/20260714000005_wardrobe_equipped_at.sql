-- SLAY CITY — track when an item was equipped
--
-- The mascot preview (wardrobe & map) shows the most recently equipped item's
-- artwork, so we need to know the equip time. `acquired_at` records purchase
-- time, not equip time, so add a dedicated `equipped_at` and stamp it from the
-- SECURITY DEFINER equip function.

alter table public.user_wardrobe_items
  add column if not exists equipped_at timestamptz;

-- Backfill currently-equipped rows so ordering is deterministic for existing
-- users (fall back to acquisition time).
update public.user_wardrobe_items
set equipped_at = acquired_at
where equipped = true and equipped_at is null;

-- Re-define equip_wardrobe_item to stamp equipped_at on equip. Identical to the
-- version in 20260714000003_wardrobe_system.sql except for the final UPDATE.
create or replace function public.equip_wardrobe_item(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile uuid := auth.uid();
  v_item record;
begin
  if v_profile is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select id, item_type, is_default
    into v_item
  from public.wardrobe_items
  where id = p_item_id and is_published = true;

  if not found then
    raise exception 'Item not found' using errcode = 'P0002';
  end if;

  -- The item must be owned. Default items are free for everyone, so grant the
  -- ownership row on first equip rather than requiring a purchase.
  if not exists (
    select 1 from public.user_wardrobe_items
    where profile_id = v_profile and wardrobe_item_id = p_item_id
  ) then
    if v_item.is_default then
      insert into public.user_wardrobe_items (profile_id, wardrobe_item_id, item_type, equipped)
      values (v_profile, p_item_id, v_item.item_type, false)
      on conflict (profile_id, wardrobe_item_id) do nothing;
    else
      raise exception 'Item not owned' using errcode = 'P0001';
    end if;
  end if;

  -- Unequip siblings first so the partial unique index is never transiently
  -- violated, then equip the target.
  update public.user_wardrobe_items
  set equipped = false
  where profile_id = v_profile
    and item_type = v_item.item_type
    and wardrobe_item_id <> p_item_id
    and equipped = true;

  update public.user_wardrobe_items
  set equipped = true, equipped_at = now()
  where profile_id = v_profile and wardrobe_item_id = p_item_id;
end;
$$;
