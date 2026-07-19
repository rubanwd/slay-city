-- SLAY CITY — one equipped wardrobe item per player (not one per category)
--
-- The original rule (20260714000003) allowed one equipped item per item_type,
-- so a player could have a hat, glasses and a hoody all marked equipped at
-- once. But wardrobe artwork is not composited: every item ships a full
-- "mascot wearing this item" image, and the mascot resolver only ever renders
-- one of them (the most recently equipped — see src/features/wardrobe/mascot.ts).
-- The result was three "ON" badges in the grid while only one skin was
-- actually visible on the character.
--
-- This migration makes the data match the artwork: at most one equipped item
-- per player, full stop.

-- Collapse existing multi-item outfits down to the item that was actually being
-- rendered — the most recently equipped one, matching resolveMascotImage's
-- ordering (equipped_at desc, nulls last for rows predating equipped_at).
update public.user_wardrobe_items u
set equipped = false
where u.equipped = true
  and u.wardrobe_item_id <> (
    select keep.wardrobe_item_id
    from public.user_wardrobe_items keep
    where keep.profile_id = u.profile_id and keep.equipped = true
    order by keep.equipped_at desc nulls last, keep.acquired_at desc
    limit 1
  );

-- Swap the invariant: one equipped row per profile, regardless of category.
drop index if exists public.user_wardrobe_items_one_equipped_per_category;

create unique index if not exists user_wardrobe_items_one_equipped_per_profile
  on public.user_wardrobe_items (profile_id)
  where equipped = true;

-- Re-define equip_wardrobe_item to take off everything else, not just the
-- items sharing the target's category. Otherwise identical to the version in
-- 20260714000005_wardrobe_equipped_at.sql.
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

  -- Take off whatever is currently worn first, so the partial unique index is
  -- never transiently violated, then put the target on.
  update public.user_wardrobe_items
  set equipped = false
  where profile_id = v_profile
    and wardrobe_item_id <> p_item_id
    and equipped = true;

  update public.user_wardrobe_items
  set equipped = true, equipped_at = now()
  where profile_id = v_profile and wardrobe_item_id = p_item_id;
end;
$$;
