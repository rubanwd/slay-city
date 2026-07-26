"use client";

import MissionScreen, { type MissionScreenProps } from "@/features/mission/MissionScreen";

import { completeDemoMission } from "./actions";

export type DemoMissionScreenProps = Pick<MissionScreenProps, "mission" | "location" | "tasks">;

/**
 * The mission player as a signed-out visitor sees it: exactly the same tasks and
 * the same screen, but finishing it records the run in the demo cookie instead
 * of granting XP and coins — there is no account to grant them to.
 *
 * The action decides where the visitor lands: back on the demo map while the
 * location still has missions left, or on the sign-up wall once it is finished.
 */
export default function DemoMissionScreen({ mission, location, tasks }: DemoMissionScreenProps) {
  return (
    <MissionScreen
      mission={mission}
      location={location}
      tasks={tasks}
      exitHref="/demo"
      onFinish={() => completeDemoMission(mission.id)}
    />
  );
}
