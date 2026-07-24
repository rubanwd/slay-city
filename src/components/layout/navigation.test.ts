import { describe, expect, it } from "vitest";

import { activeNavIndex, navItemsForRole } from "./navigation";

describe("navItemsForRole", () => {
  it("gives a child the game tabs, with Homework only when they have a group", () => {
    expect(navItemsForRole("child").map((item) => item.href)).toEqual([
      "/map",
      "/wardrobe",
      "/profile",
    ]);
    expect(navItemsForRole("child", { showHomework: true }).map((item) => item.href)).toEqual([
      "/map",
      "/wardrobe",
      "/homework",
      "/profile",
    ]);
  });

  it("keeps parents and teachers inside their own console area", () => {
    expect(navItemsForRole("parent").map((item) => item.href)).toEqual([
      "/parent",
      "/parent/map",
      "/parent/profile",
    ]);
    expect(navItemsForRole("teacher").map((item) => item.href)).toEqual([
      "/teacher",
      "/teacher/map",
      "/teacher/profile",
    ]);
  });

  it("never offers an adult the wardrobe or homework tabs", () => {
    for (const role of ["parent", "teacher"] as const) {
      const icons = navItemsForRole(role, { showHomework: true }).map((item) => item.icon);
      expect(icons).not.toContain("wardrobe");
      expect(icons).not.toContain("homework");
    }
  });
});

describe("activeNavIndex", () => {
  const childItems = navItemsForRole("child", { showHomework: true });
  const parentItems = navItemsForRole("parent");

  it("marks the tab whose route the path belongs to", () => {
    expect(activeNavIndex("/map", childItems)).toBe(0);
    expect(activeNavIndex("/homework", childItems)).toBe(2);
    // A topic inside Homework still highlights the Homework tab.
    expect(activeNavIndex("/homework/topic-1", childItems)).toBe(2);
  });

  it("prefers the most specific tab when one route nests inside another", () => {
    expect(activeNavIndex("/parent", parentItems)).toBe(0);
    expect(activeNavIndex("/parent/map", parentItems)).toBe(1);
    expect(activeNavIndex("/parent/profile", parentItems)).toBe(2);
  });

  it("highlights nothing on a screen no tab owns", () => {
    expect(activeNavIndex("/mission/abc", childItems)).toBe(-1);
  });

  it("does not treat a shared prefix as a match", () => {
    // `/mapmaker` is not inside the Map tab, despite starting with "/map".
    expect(activeNavIndex("/mapmaker", childItems)).toBe(-1);
  });
});
