import type { Database } from "@/types/database";

export type MissionTaskType = Database["public"]["Enums"]["mission_task_type"];

/** Selectable task types, in the order they appear in the admin dropdowns. */
export const TASK_TYPES: MissionTaskType[] = [
  "vocabulary",
  "matching",
  "listening",
  "quiz",
  "snake_game",
];

const TASK_TYPE_LABELS: Record<MissionTaskType, string> = {
  vocabulary: "Vocabulary",
  matching: "Matching",
  listening: "Listening",
  quiz: "Quiz",
  snake_game: "Play Snake Game",
};

export function taskTypeLabel(taskType: MissionTaskType): string {
  return TASK_TYPE_LABELS[taskType] ?? taskType;
}
