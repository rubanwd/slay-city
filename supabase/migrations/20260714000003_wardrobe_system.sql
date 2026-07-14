-- SLAY CITY — wardrobe & customization system
--
-- Extends the wardrobe_items catalog with the fields the customization UI
-- needs (category metadata via item_type, description, previews, level gating,
-- default items, ordering) and adds the server-side purchase/equip flow.
--
-- SECURITY MODEL
-- Authenticated users hold only SELECT on user_wardrobe_items after this
-- migration (the direct INSERT grant is revoked below) and have no UPDATE grant
-- on user_stats. That means:
--   * coins can never be spent from the browser, and
--   * ownership rows can never be created for free from the browser.
-- Both acquiring and equipping items go exclusively through the SECURITY
-- DEFINER functions defined here, which run with the owner's rights, act only
-- on auth.uid()'s own rows, and read prices/levels from the trusted catalog
-- row rather than trusting the client.

-- =========================================================================
-- Catalog columns
-- =========================================================================
-- item_type already exists and is NOT NULL; it is the item's category
-- (e.g. 'hat', 'glasses', 'accessory', 'color'). The one-equipped-per-category
-- rule below is enforced against it.

alter table public.wardrobe_items add column if not exists description text;
alter table public.wardrobe_items add column if not exists preview_url text;
alter table public.wardrobe_items add column if not exists unlock_level integer;
alter table public.wardrobe_items add column if not exists is_default boolean not null default false;
alter table public.wardrobe_items add column if not exists order_index integer not null default 0;

-- =========================================================================
-- Ownership: denormalized category for a DB-level "one equipped per category"
-- guarantee
-- =========================================================================
-- A partial unique index is the clean way to enforce "at most one equipped
-- item per category per user", but the category lives on wardrobe_items. We
-- copy it onto the ownership row (an item's category never changes) so the
-- index can reference it directly. The equip function keeps it authoritative.

alter table public.user_wardrobe_items add column if not exists item_type text;

update public.user_wardrobe_items u
set item_type = w.item_type
from public.wardrobe_items w
where u.wardrobe_item_id = w.id and u.item_type is null;

-- Hard invariant: a user can have at most one equipped item in any category.
create unique index if not exists user_wardrobe_items_one_equipped_per_category
  on public.user_wardrobe_items (profile_id, item_type)
  where equipped = true;

-- Catalog browse order.
create index if not exists wardrobe_items_type_order_idx
  on public.wardrobe_items (item_type, order_index);

-- =========================================================================
-- Close the free-acquisition hole: all ownership rows must be created through
-- purchase_wardrobe_item / equip_wardrobe_item (SECURITY DEFINER), never by a
-- direct client insert.
-- =========================================================================

revoke insert on public.user_wardrobe_items from authenticated;

-- =========================================================================
-- purchase_wardrobe_item — spend coins to acquire an item
-- =========================================================================

create or replace function public.purchase_wardrobe_item(p_item_id uuid)
returns table (coins_remaining integer, item_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile uuid := auth.uid();
  v_item record;
  v_stats record;
begin
  if v_profile is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  -- Price, level gate and category all come from the trusted catalog row.
  select id, cost_coins, unlock_level, item_type
    into v_item
  from public.wardrobe_items
  where id = p_item_id and is_published = true;

  if not found then
    raise exception 'Item not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.user_wardrobe_items
    where profile_id = v_profile and wardrobe_item_id = p_item_id
  ) then
    raise exception 'Item already owned' using errcode = '23505';
  end if;

  -- Lock the stats row so a concurrent purchase can't double-spend coins.
  select coins, level into v_stats
  from public.user_stats
  where profile_id = v_profile
  for update;

  if not found then
    raise exception 'No stats row for user' using errcode = 'P0002';
  end if;

  if v_item.unlock_level is not null and v_stats.level < v_item.unlock_level then
    raise exception 'Level too low' using errcode = 'P0001';
  end if;

  if v_stats.coins < v_item.cost_coins then
    raise exception 'Not enough coins' using errcode = 'P0001';
  end if;

  update public.user_stats
  set coins = coins - v_item.cost_coins
  where profile_id = v_profile;

  insert into public.user_wardrobe_items (profile_id, wardrobe_item_id, item_type, equipped)
  values (v_profile, p_item_id, v_item.item_type, false);

  coins_remaining := v_stats.coins - v_item.cost_coins;
  item_id := p_item_id;
  return next;
end;
$$;

-- =========================================================================
-- equip_wardrobe_item — equip an owned (or default) item, enforcing one per
-- category
-- =========================================================================

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
  set equipped = true
  where profile_id = v_profile and wardrobe_item_id = p_item_id;
end;
$$;

-- =========================================================================
-- unequip_wardrobe_item — take an item off (leaves the category empty)
-- =========================================================================

create or replace function public.unequip_wardrobe_item(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile uuid := auth.uid();
begin
  if v_profile is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  update public.user_wardrobe_items
  set equipped = false
  where profile_id = v_profile and wardrobe_item_id = p_item_id;
end;
$$;

grant execute on function public.purchase_wardrobe_item(uuid) to authenticated;
grant execute on function public.equip_wardrobe_item(uuid) to authenticated;
grant execute on function public.unequip_wardrobe_item(uuid) to authenticated;
