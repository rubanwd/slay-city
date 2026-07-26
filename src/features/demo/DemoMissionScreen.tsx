"use client";

import MissionScreen, { type MissionScreenProps } from "@/features/mission/MissionScreen";
import { playRewardApplauseSfx } from "@/lib/sfx";

import { completeDemoMission } from "./actions";

export type DemoMissionScreenProps = Pick<MissionScreenProps, "mission" | "location" | "tasks">;

/**
 * The mission player as a signed-out visitor sees it: exactly the same tasks and
 * the same screen, but finishing it records the run in the demo cookie instead
 * of granting XP and coins — there is no account to grant them to.
 *
 * The action decides where the visitor lands: back on the demo map while the
 * location still has missions left, or on the sign-up wall once it is finished.
 * There is no Rewards screen to land on either way, so the applause that a
 * signed-in player hears there plays right here instead — a visitor finishing
 * a mission should feel exactly as celebrated as one who is signed in.
 */
export default function DemoMissionScreen({ mission, location, tasks }: DemoMissionScreenProps) {
  return (
    <MissionScreen
      mission={mission}
      location={location}
      tasks={tasks}
      exitHref="/demo"
      onFinish={async () => {
        const result = await completeDemoMission(mission.id);
        if (result.ok) {
          void playRewardApplauseSfx();
        }
        return result;
      }}
    />
  );
}
