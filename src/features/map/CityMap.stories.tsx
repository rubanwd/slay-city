import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import CityMap from "./CityMap";
import type { MapDistrictViewModel } from "./mapState";

/** Stand-in district — the real one comes from the page's Supabase queries. */
const DISTRICT: MapDistrictViewModel = {
  id: "district-1",
  name: "Downtown",
  backgroundUrl: null,
  locations: [
    {
      id: "loc-1",
      name: "Coffee Corner",
      description: "Order a drink and meet the barista.",
      mapX: 30,
      mapY: 32,
      state: "unlocked",
      missionId: "mission-1",
      iconUrl: null,
      totalXp: 120,
      totalCoins: 60,
      missionsCompleted: 0,
      totalMissions: 3,
    },
    {
      id: "loc-2",
      name: "Neon Mall",
      description: "Shopping, sizes and colours.",
      mapX: 66,
      mapY: 58,
      state: "unlocked",
      missionId: "mission-4",
      iconUrl: null,
      totalXp: 80,
      totalCoins: 40,
      missionsCompleted: 0,
      totalMissions: 2,
    },
  ],
};

const meta = {
  title: "Map/CityMap",
  component: CityMap,
  parameters: { layout: "fullscreen" },
  args: {
    district: DISTRICT,
    hud: { xp: 340, coins: 120, level: 3, currentStreak: 4 },
    mascotImageUrl: "/wardrobe/slay-base.webp",
  },
} satisfies Meta<typeof CityMap>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The signed-in map: HUD on top, tab bar at the bottom. */
export const Player: Story = {};

/**
 * The signed-out demo a visitor lands on before they have an account: no
 * scoreboard, a log-in button instead of the tab bar, and missions pointing at
 * the public player. Labels come from the browser's language.
 */
export const Demo: Story = {
  args: {
    hud: { xp: 0, coins: 0, level: 1, currentStreak: 0 },
    demo: {
      loginHref: "/auth/login",
      loginLabel: "Log in",
      missionHrefBase: "/demo/mission",
    },
  },
};
