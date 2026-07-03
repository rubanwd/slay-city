import { describe, expect, it } from "vitest";

import { buildMapViewModel } from "./mapState";

const districts = [{ id: "d1", name: "Central Plaza", order_index: 0 }];

const locations = [
  {
    id: "l1",
    district_id: "d1",
    name: "Market Square",
    description: null,
    order_index: 0,
    map_x: 25,
    map_y: 40,
  },
  {
    id: "l2",
    district_id: "d1",
    name: "Library Corner",
    description: null,
    order_index: 1,
    map_x: 60,
    map_y: 55,
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
      { id: "d1", name: "Central Plaza", order_index: 0 },
      { id: "d2", name: "Second District", order_index: 1 },
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
