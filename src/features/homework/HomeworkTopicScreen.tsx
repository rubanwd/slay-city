"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AppContainer, Section } from "@/components/layout";
import { SlayButton } from "@/components/ui";
import HowToPlayButton from "@/features/mission/HowToPlayButton";
import ProgressBar from "@/features/mission/ProgressBar";
import TaskRunner from "@/features/mission/TaskRunner";
import { taskTypeInstructions, type MissionTaskType, type MissionTaskViewModel } from "@/features/mission/types";

import { completeHomeworkTask } from "./actions";

/** Task types that take over the whole panel and manage their own layout/progress. */
const IMMERSIVE_TASK_TYPES: MissionTaskType[] = ["snake_game", "bubble_pop"];

export interface HomeworkTopicScreenProps {
  topic: { id: string; title: string; description: string | null };
  tasks: MissionTaskViewModel[];
  /** Task ids the child has already completed, so a resumed topic picks up where they left off. */
  completedTaskIds: string[];
}

function firstIncompleteIndex(tasks: MissionTaskViewModel[], completed: Set<string>): number {
  const index = tasks.findIndex((task) => !completed.has(task.id));
  return index === -1 ? 0 : index;
}

/**
 * Runs a homework topic's tasks one at a time, mirroring `MissionScreen`, but
 * with two deliberate differences: completion is saved after *every* task
 * (not just the last one), so leaving mid-topic keeps progress; and finishing
 * grants no XP/coins — homework sits outside the map's reward loop.
 */
export default function HomeworkTopicScreen({ topic, tasks, completedTaskIds }: HomeworkTopicScreenProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState<Set<string>>(() => new Set(completedTaskIds));
  const [currentIndex, setCurrentIndex] = useState(() =>
    firstIncompleteIndex(tasks, new Set(completedTaskIds))
  );
  const [finished, setFinished] = useState(tasks.length > 0 && completedTaskIds.length >= tasks.length);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  const total = tasks.length;
  const currentTask = tasks[currentIndex];
  const isLastTask = currentIndex === total - 1;

  const handleTaskComplete = () => {
    if (!currentTask) return;
    setError(null);
    startSave(async () => {
      const result = await completeHomeworkTask(currentTask.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCompleted((prev) => new Set(prev).add(currentTask.id));
      if (isLastTask) {
        setFinished(true);
      } else {
        setCurrentIndex((index) => index + 1);
      }
    });
  };

  const handleExit = () => {
    if (window.confirm("Leave this topic? Your progress on this task will be lost.")) {
      router.push("/homework");
    }
  };

  if (total === 0) {
    return (
      <AppContainer className="justify-center">
        <Section className="items-center gap-4 text-center">
          <h1 className="text-h2 font-black text-white">{topic.title}</h1>
          <p className="text-white/60">This topic has no tasks yet.</p>
          <SlayButton variant="ghost" onClick={() => router.push("/homework")}>
            Back to Homework
          </SlayButton>
        </Section>
      </AppContainer>
    );
  }

  if (finished) {
    return (
      <AppContainer className="justify-center">
        <Section className="items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-green/15 text-3xl">
            🎉
          </span>
          <h1 className="text-h2 font-black text-white">{topic.title} done!</h1>
          <p className="text-white/60">You finished every task in this topic.</p>
          <div className="flex w-full flex-col gap-2">
            <SlayButton
              variant="green"
              onClick={() => {
                setCurrentIndex(0);
                setFinished(false);
              }}
            >
              Practice Again
            </SlayButton>
            <SlayButton variant="ghost" onClick={() => router.push("/homework")}>
              Back to Homework
            </SlayButton>
          </div>
        </Section>
      </AppContainer>
    );
  }

  const actionLabel = isLastTask ? "Finish Topic" : "Next";

  return (
    <AppContainer fixedHeight>
      <Section pt="lg" pb="sm" className="shrink-0 gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={handleExit}
              aria-label="Exit topic"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M2 2l12 12M14 2L2 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <span className="truncate text-[11px] font-bold uppercase tracking-[0.15em] text-white/50">
              {topic.title}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <HowToPlayButton text={taskTypeInstructions(currentTask.taskType)} />
            <span className="text-sm font-bold text-white/50 whitespace-nowrap">
              {currentIndex + 1}/{total}
            </span>
          </div>
        </div>
        {!IMMERSIVE_TASK_TYPES.includes(currentTask.taskType) && (
          <ProgressBar completed={completed.size} total={total} />
        )}
      </Section>

      <Section py="sm" className="min-h-0 flex-1 overflow-y-auto">
        <TaskRunner
          key={currentTask.id}
          taskType={currentTask.taskType}
          content={currentTask.content}
          actionLabel={actionLabel}
          onComplete={handleTaskComplete}
        />
      </Section>

      {(error || isSaving) && (
        <Section py="sm" className="shrink-0 items-center">
          {isSaving && <p className="animate-pulse text-white/60">Saving your progress…</p>}
          {error && <p className="text-center text-neon-pink">{error}</p>}
        </Section>
      )}
    </AppContainer>
  );
}
