import type { District, Location, Mission } from "@/types";

export type LocationState = "locked" | "unlocked" | "current" | "completed";

export interface LocationProgress {
  /** Locations where every published mission has been completed. */
  completedLocationIds: Set<string>;
  /** The next not-yet-completed mission at each location, in `order_index` order. */
  nextMissionIdByLocation: Map<string, string>;
}

/**
 * A location can have several missions played in sequence. Given every
 * published mission and the set of mission ids the player has already
 * completed, this picks — per location — the next uncompleted mission (by
 * `order_index`), and flags a location "completed" once none remain.
 */
export function buildLocationProgress(
  missions: Pick<Mission, "id" | "location_id" | "order_index">[],
  completedMissionIds: ReadonlySet<string>
): LocationProgress {
  const missionsByLocation = new Map<string, Pick<Mission, "id" | "location_id" | "order_index">[]>();
  for (const mission of missions) {
    const list = missionsByLocation.get(mission.location_id) ?? [];
    list.push(mission);
    missionsByLocation.set(mission.location_id, list);
  }

  const completedLocationIds = new Set<string>();
  const nextMissionIdByLocation = new Map<string, string>();

  for (const [locationId, locationMissions] of missionsByLocation) {
    const next = [...locationMissions]
      .sort((a, b) => a.order_index - b.order_index)
      .find((mission) => !completedMissionIds.has(mission.id));

    if (next) {
      nextMissionIdByLocation.set(locationId, next.id);
    } else {
      completedLocationIds.add(locationId);
    }
  }

  return { completedLocationIds, nextMissionIdByLocation };
}

export interface MapLocationViewModel {
  id: string;
  name: string;
  description: string | null;
  mapX: number;
  mapY: number;
  state: LocationState;
  missionId: string | null;
}

export interface MapDistrictViewModel {
  id: string;
  name: string;
  locations: MapLocationViewModel[];
}

/**
 * Builds the per-location unlock state for the whole map.
 *
 * A location is unlocked once every earlier location in the *same* district
 * (by order_index) has a completed user_progress row — districts themselves
 * aren't gated against each other, so more than one district's first location
 * can be independently unlocked at once. Only the single earliest unlocked,
 * not-yet-completed location across the whole map is flagged "current" (it
 * gets the mascot overlay); any other district's own frontier is "unlocked"
 * but not "current".
 */
export function buildMapViewModel(
  districts: Pick<District, "id" | "name" | "order_index">[],
  locations: Pick<Location, "id" | "district_id" | "name" | "description" | "order_index" | "map_x" | "map_y">[],
  completedLocationIds: ReadonlySet<string>,
  missionIdByLocation: ReadonlyMap<string, string>
): MapDistrictViewModel[] {
  const sortedDistricts = [...districts].sort((a, b) => a.order_index - b.order_index);
  let currentAssigned = false;

  return sortedDistricts.map((district) => {
    const districtLocations = locations
      .filter((loc) => loc.district_id === district.id)
      .sort((a, b) => a.order_index - b.order_index);

    let allPreviousCompleted = true;

    const viewLocations: MapLocationViewModel[] = districtLocations.map((loc) => {
      const isCompleted = completedLocationIds.has(loc.id);
      const isUnlocked = allPreviousCompleted;

      let state: LocationState;
      if (isCompleted) {
        state = "completed";
      } else if (isUnlocked && !currentAssigned) {
        state = "current";
        currentAssigned = true;
      } else if (isUnlocked) {
        state = "unlocked";
      } else {
        state = "locked";
      }

      // Only a completed stop keeps the "all previous completed" streak alive
      // for the next sibling in this district.
      allPreviousCompleted = allPreviousCompleted && isCompleted;

      return {
        id: loc.id,
        name: loc.name,
        description: loc.description,
        mapX: Number(loc.map_x ?? 50),
        mapY: Number(loc.map_y ?? 50),
        state,
        missionId: missionIdByLocation.get(loc.id) ?? null,
      };
    });

    return { id: district.id, name: district.name, locations: viewLocations };
  });
}
