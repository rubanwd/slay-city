import type { MissionTaskType } from "@/features/mission/types";

export type { MissionTaskType };
export { taskTypeLabel } from "@/features/mission/types";

/** Selectable task types, in the order they appear in the admin dropdowns. */
export const TASK_TYPES: MissionTaskType[] = [
  "vocabulary",
  "matching",
  "listening",
  "quiz",
  "snake_game",
];
