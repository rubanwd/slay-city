import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import CityMapPreview from "./CityMapPreview";
import type { MapDistrictViewModel } from "./mapState";

/** Stand-in districts — the real ones come from `loadMapPreview`. */
const DISTRICTS: MapDistrictViewModel[] = [
  {
    id: "district-1",
    name: "Downtown",
    backgroundUrl: null,
    locations: [
      {
        id: "loc-1",
        name: "Coffee Corner",
        description: "Order a drink and meet the barista.",
        mapX: 30,
        mapY: 30,
        state: "unlocked",
        missionId: null,
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
        mapX: 65,
        mapY: 55,
        state: "unlocked",
        missionId: null,
        iconUrl: null,
        totalXp: 80,
        totalCoins: 40,
        missionsCompleted: 0,
        totalMissions: 2,
      },
    ],
  },
  {
    id: "district-2",
    name: "Riverside",
    backgroundUrl: null,
    locations: [
      {
        id: "loc-3",
        name: "Skate Park",
        description: null,
        mapX: 45,
        mapY: 40,
        state: "unlocked",
        missionId: null,
        iconUrl: null,
        totalXp: 60,
        totalCoins: 30,
        missionsCompleted: 0,
        totalMissions: 1,
      },
    ],
  },
];

const meta: Meta<typeof CityMapPreview> = {
  title: "Map/CityMapPreview",
  component: CityMapPreview,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
  args: {
    districts: DISTRICTS,
    levelName: "Elementary",
    role: "parent",
    subtitle: "What your student explores",
  },
};

export default meta;
type Story = StoryObj<typeof CityMapPreview>;

export const Parent: Story = {};

/** The student has finished the first stop — the map marks it and counts missions. */
export const WithStudentProgress: Story = {
  args: {
    progressLabel: "Piotre",
    districts: [
      {
        ...DISTRICTS[0],
        locations: [
          { ...DISTRICTS[0].locations[0], state: "completed", missionsCompleted: 3 },
          { ...DISTRICTS[0].locations[1], missionsCompleted: 1 },
        ],
      },
      DISTRICTS[1],
    ],
  },
};

/** The teacher's map: no student progress, and every stop opens its missions. */
export const Teacher: Story = {
  args: {
    role: "teacher",
    subtitle: "Every district and mission",
    locationHrefBase: "/teacher/location",
  },
};

/** No published districts for the picked level yet. */
export const Empty: Story = {
  args: { districts: [] },
};
