"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { AppContainer, Section } from "@/components/layout";
import { SlayButton } from "@/components/ui";

import { submitMissionCompletion } from "./actions";
import HowToPlayButton from "./HowToPlayButton";
import ProgressBar from "./ProgressBar";
import TaskRunner from "./TaskRunner";
import {
  taskTypeInstructions,
  type MissionTaskType,
  type MissionTaskViewModel,
  type MissionViewModel,
} from "./types";

/** Task types that take over the whole panel and manage their own layout/progress. */
const IMMERSIVE_TASK_TYPES: MissionTaskType[] = ["snake_game", "bubble_pop"];

export interface MissionScreenProps {
  mission: MissionViewModel;
  /** The location this mission belongs to — its icon and name head the screen. */
  location?: { name: string; iconUrl: string | null } | null;
  tasks: MissionTaskViewModel[];
}

export default function MissionScreen({ mission, location, tasks }: MissionScreenProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, startSubmit] = useTransition();
  // One score (0–1) per completed task, so a task finished early (e.g. the
  // Snake game) only dents the mission's overall reward rather than voiding it.
  const taskScores = useRef<number[]>([]);
  const overallScore = useRef(1);

  const total = tasks.length;
  const currentTask = tasks[currentIndex];
  const isLastTask = currentIndex === total - 1;

  const finishMission = () => {
    setError(null);
    startSubmit(async () => {
      const result = await submitMissionCompletion(mission.id, overallScore.current);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/mission/${mission.id}/reward`);
    });
  };

  const handleTaskComplete = (score = 1) => {
    const scores = [...taskScores.current, score];
    if (isLastTask) {
      overallScore.current = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      finishMission();
    } else {
      taskScores.current = scores;
      setCurrentIndex((index) => index + 1);
    }
  };

  const handleExit = () => {
    if (window.confirm("Leave this mission? Your progress on this task will be lost.")) {
      router.push("/map");
    }
  };

  if (total === 0) {
    return (
      <AppContainer className="justify-center">
        <Section className="items-center gap-4 text-center">
          <h1 className="text-h2 font-black text-white">{mission.title}</h1>
          <p className="text-white/60">This mission has no tasks yet.</p>
          <SlayButton variant="ghost" onClick={() => router.push("/map")}>
            Back to Map
          </SlayButton>
        </Section>
      </AppContainer>
    );
  }

  const actionLabel = isLastTask ? "Finish Mission" : "Next";

  return (
    <AppContainer fixedHeight>
      <Section pt="lg" pb="sm" className="shrink-0 gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={handleExit}
              aria-label="Exit mission"
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
            {location?.iconUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded location icon
              <img
                src={location.iconUrl}
                alt=""
                aria-hidden="true"
                className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-lime-green/60 shadow-[0_0_12px_rgba(157,255,0,0.35)]"
              />
            )}
            {location && (
              <span className="truncate text-xs font-bold uppercase tracking-[0.15em] text-white/50">
                {location.name}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <HowToPlayButton text={taskTypeInstructions(currentTask.taskType)} />
            <span className="text-base font-bold text-white/50 whitespace-nowrap">
              {currentIndex + 1}/{total}
            </span>
          </div>
        </div>
        {!IMMERSIVE_TASK_TYPES.includes(currentTask.taskType) && (
          <ProgressBar completed={currentIndex} total={total} />
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

      {(error || isSubmitting) && (
        <Section py="sm" className="shrink-0 items-center">
          {isSubmitting && <p className="text-white/60 animate-pulse">Saving your rewards…</p>}
          {error && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-neon-pink text-center">{error}</p>
              <SlayButton variant="pink" onClick={finishMission} loading={isSubmitting}>
                Try Again
              </SlayButton>
            </div>
          )}
        </Section>
      )}
    </AppContainer>
  );
}

