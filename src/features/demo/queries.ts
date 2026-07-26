import { cookies } from "next/headers";

import type { createClient } from "@/lib/supabase/server";
import type { KnowledgeLevel } from "@/types";

import {
  buildLocationProgress,
  buildMapViewModel,
  sumLocationRewards,
  type MapDistrictViewModel,
} from "@/features/map/mapState";

import {
  DEMO_PROGRESS_COOKIE,
  parseDemoProgress,
  selectDemoDistrict,
  type DemoProgress,
} from "./demoProgress";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * The level the signed-out demo is played at.
 *
 * Elementary — the level the city is actually built out at today, and the one a
 * new student starts on, so a visitor sees the real opening of the game rather
 * than a special demo build of it.
 */
export const DEMO_LEVEL: KnowledgeLevel = "elementary";

/** The demo run of the current visitor, read from their cookie. */
export async function readDemoProgress(): Promise<DemoProgress> {
  const cookieStore = await cookies();
  return parseDemoProgress(cookieStore.get(DEMO_PROGRESS_COOKIE)?.value);
}

/**
 * The one district the demo map shows, with every one of its locations freely
 * selectable — exactly like the signed-in map, except progress comes from the
 * visitor's cookie instead of `user_progress`.
 *
 * Every table read here is published content, which the `anon` role is granted
 * SELECT on (see the RLS policies in the initial schema migration), so this
 * works with no session at all.
 */
export async function getDemoDistrict(
  supabase: SupabaseServerClient,
  progress: DemoProgress
): Promise<MapDistrictViewModel | null> {
  const [districtsRes, locationsRes, missionsRes] = await Promise.all([
    supabase
      .from("districts")
      .select("id, name, order_index, background_image_url")
      .eq("is_published", true)
      .eq("level", DEMO_LEVEL)
      .order("order_index"),
    supabase
      .from("locations")
      .select("id, district_id, name, description, order_index, map_x, map_y, icon_url")
      .eq("is_published", true)
      .order("order_index"),
    supabase
      .from("missions")
      .select("id, location_id, order_index, xp_reward, coin_reward")
      .eq("is_published", true)
      .order("order_index"),
  ]);

  const districts = districtsRes.data ?? [];
  const publishedDistrictIds = new Set(districts.map((district) => district.id));
  const locations = (locationsRes.data ?? []).filter((location) =>
    publishedDistrictIds.has(location.district_id)
  );
  const missions = missionsRes.data ?? [];

  const completedMissionIds = new Set(progress.completedMissionIds);
  const { completedLocationIds, nextMissionIdByLocation, missionCountsByLocation } =
    buildLocationProgress(missions, completedMissionIds);

  const mapDistricts = buildMapViewModel(
    districts,
    locations,
    completedLocationIds,
    nextMissionIdByLocation,
    sumLocationRewards(missions),
    missionCountsByLocation
  );

  return selectDemoDistrict(mapDistricts);
}

/**
 * The ids of every published mission at `locationId`, in play order — what
 * "finishing this location" means for the demo gate.
 */
export async function getLocationMissionIds(
  supabase: SupabaseServerClient,
  locationId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("missions")
    .select("id")
    .eq("location_id", locationId)
    .eq("is_published", true)
    .order("order_index");

  return (data ?? []).map((mission) => mission.id);
}

/**
 * The location a mission belongs to, but only if that mission is part of the
 * demo — published, at a published location, in a published district of
 * {@link DEMO_LEVEL}. Null for anything else.
 *
 * Both public demo routes take a mission id straight from the URL (or, for the
 * completion action, from the browser), so neither may assume the mission is
 * one the demo map could actually have offered.
 */
export async function getDemoMissionLocationId(
  supabase: SupabaseServerClient,
  missionId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("missions")
    .select("location_id, locations!inner(is_published, districts!inner(is_published, level))")
    .eq("id", missionId)
    .eq("is_published", true)
    .eq("locations.is_published", true)
    .eq("locations.districts.is_published", true)
    .eq("locations.districts.level", DEMO_LEVEL)
    .maybeSingle();

  return data?.location_id ?? null;
}
