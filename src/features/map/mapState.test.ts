import { describe, expect, it } from "vitest";

import { buildLocationProgress, buildMapViewModel } from "./mapState";

const districts = [
  { id: "d1", name: "Central Plaza", order_index: 0, background_image_url: null },
];

const locations = [
  {
    id: "l1",
    district_id: "d1",
    name: "Market Square",
    description: null,
    order_index: 0,
    map_x: 25,
    map_y: 40,
    icon_url: null,
  },
  {
    id: "l2",
    district_id: "d1",
    name: "Library Corner",
    description: null,
    order_index: 1,
    map_x: 60,
    map_y: 55,
    icon_url: null,
  },
];

describe("buildMapViewModel", () => {
  it("marks the first location as current and later ones locked when nothing is completed", () => {
    const [district] = buildMapViewModel(districts, locations, new Set(), new Map());

    expect(district.locations.map((l) => l.state)).toEqual(["current", "locked"]);
  });

  it("unlocks the next location once the previous one is completed", () => {
    const [district] = buildMapViewModel(districts, locations, new Set(["l1"]), new Map());

    expect(district.locations.map((l) => [l.id, l.state])).toEqual([
      ["l1", "completed"],
      ["l2", "current"],
    ]);
  });

  it("only assigns 'current' once across multiple districts, others become 'unlocked'", () => {
    const twoDistricts = [
      { id: "d1", name: "Central Plaza", order_index: 0, background_image_url: null },
      { id: "d2", name: "Second District", order_index: 1, background_image_url: null },
    ];
    const twoDistrictLocations = [
      ...locations,
      {
        id: "l3",
        district_id: "d2",
        name: "Other District First Stop",
        description: null,
        order_index: 0,
        map_x: 10,
        map_y: 10,
        icon_url: null,
      },
    ];

    const result = buildMapViewModel(twoDistricts, twoDistrictLocations, new Set(), new Map());
    const flat = result.flatMap((d) => d.locations);

    expect(flat.find((l) => l.id === "l1")?.state).toBe("current");
    expect(flat.find((l) => l.id === "l3")?.state).toBe("unlocked");
  });

  it("attaches the first mission id for a location when one exists, otherwise null", () => {
    const missions = new Map([["l1", "m1"]]);
    const [district] = buildMapViewModel(districts, locations, new Set(), missions);

    expect(district.locations[0].missionId).toBe("m1");
    expect(district.locations[1].missionId).toBeNull();
  });
});

describe("buildLocationProgress", () => {
  const missions = [
    { id: "m1", location_id: "l1", order_index: 0 },
    { id: "m2", location_id: "l1", order_index: 1 },
    { id: "m3", location_id: "l2", order_index: 0 },
  ];

  it("picks the first mission (by order_index) as next when none are completed", () => {
    const { completedLocationIds, nextMissionIdByLocation } = buildLocationProgress(missions, new Set());

    expect(nextMissionIdByLocation.get("l1")).toBe("m1");
    expect(nextMissionIdByLocation.get("l2")).toBe("m3");
    expect(completedLocationIds.size).toBe(0);
  });

  it("advances to the next mission at a location once the current one is completed", () => {
    const { completedLocationIds, nextMissionIdByLocation } = buildLocationProgress(
      missions,
      new Set(["m1"])
    );

    expect(nextMissionIdByLocation.get("l1")).toBe("m2");
    expect(completedLocationIds.has("l1")).toBe(false);
  });

  it("marks a location completed once every one of its missions is completed", () => {
    const { completedLocationIds, nextMissionIdByLocation } = buildLocationProgress(
      missions,
      new Set(["m1", "m2"])
    );

    expect(completedLocationIds.has("l1")).toBe(true);
    expect(nextMissionIdByLocation.has("l1")).toBe(false);
    // l2's mission is untouched — it should be unaffected by l1's completion.
    expect(nextMissionIdByLocation.get("l2")).toBe("m3");
  });
});
