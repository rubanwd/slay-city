"use client";

import { ProgressBar as UIProgressBar } from "@/components/ui";

export interface MissionProgressBarProps {
  /** Number of tasks completed so far. */
  completed: number;
  /** Total number of tasks in the mission. */
  total: number;
}

/**
 * Thin wrapper over the shared UI ProgressBar that renders mission task
 * progress as a fraction (e.g. "3/5") above a neon fill bar.
 */
export default function ProgressBar({ completed, total }: MissionProgressBarProps) {
  const safeTotal = Math.max(total, 1);
  const value = (completed / safeTotal) * 100;

  return (
    <UIProgressBar
      value={value}
      variant="pink"
      label="Progress"
      labelRight={`${completed}/${total}`}
    />
  );
}
