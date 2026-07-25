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
  /**
   * Review mode: play the mission exactly as a student sees it, but record
   * nothing — no completion row, no XP or coins, no reward screen. Used by the
   * teacher console to check the content students are given.
   */
  review?: boolean;
  /** Where exiting (and finishing a review) goes. Defaults to the student map. */
  exitHref?: string;
  /** Review mode only: the next mission at this location, offered at the end. */
  nextMission?: { title: string; href: string } | null;
}

export default function MissionScreen({
  mission,
  location,
  tasks,
  review = false,
  exitHref = "/map",
  nextMission = null,
}: MissionScreenProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, startSubmit] = useTransition();
  /** Review mode has no reward screen to move on to — this end card stands in. */
  const [reviewFinished, setReviewFinished] = useState(false);

  // Running share of the mission reward the player has earned. Tasks that can be
  // finished early (the word search) report a fraction in [0, 1]; every fully
  // completed task reports 1. Multiplying keeps the mission reward proportional
  // to how much of it the player actually completed.
  const rewardFractionRef = useRef(1);

  const total = tasks.length;
  const currentTask = tasks[currentIndex];
  const isLastTask = currentIndex === total - 1;

  const finishMission = (rewardFraction: number) => {
    setError(null);
    if (review) {
      setReviewFinished(true);
      return;
    }
    startSubmit(async () => {
      const result = await submitMissionCompletion(mission.id, rewardFraction);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/mission/${mission.id}/reward`);
    });
  };

  const handleTaskComplete = (rewardFraction = 1) => {
    const fraction = Math.min(1, Math.max(0, rewardFraction));
    rewardFractionRef.current *= fraction;
    if (isLastTask) {
      finishMission(rewardFractionRef.current);
    } else {
      setCurrentIndex((index) => index + 1);
    }
  };

  const handleExit = () => {
    // A review records nothing, so there is nothing to warn about losing.
    if (review) {
      router.push(exitHref);
      return;
    }
    if (window.confirm("Leave this mission? Your progress on this task will be lost.")) {
      router.push(exitHref);
    }
  };

  const restart = () => {
    rewardFractionRef.current = 1;
    setCurrentIndex(0);
    setReviewFinished(false);
  };

  if (total === 0) {
    return (
      <AppContainer className="justify-center">
        <Section className="items-center gap-4 text-center">
          <h1 className="text-h2 font-black text-white">{mission.title}</h1>
          <p className="text-white/60">This mission has no tasks yet.</p>
          <SlayButton variant="ghost" onClick={() => router.push(exitHref)}>
            {review ? "Back" : "Back to Map"}
          </SlayButton>
        </Section>
      </AppContainer>
    );
  }

  if (reviewFinished) {
    return (
      <AppContainer className="justify-center">
        <Section className="items-center gap-4 text-center">
          <h1 className="text-h2 font-black text-white">{mission.title}</h1>
          <p className="text-white/60">
            That&apos;s every task in this mission. Reviews aren&apos;t recorded — no progress, XP
            or coins were given.
          </p>
          <div className="flex w-full flex-col gap-3 pt-2">
            {nextMission && (
              <SlayButton onClick={() => router.push(nextMission.href)}>
                Next: {nextMission.title}
              </SlayButton>
            )}
            <SlayButton variant="ghost" onClick={restart}>
              Play Again
            </SlayButton>
            <SlayButton variant="ghost" onClick={() => router.push(exitHref)}>
              Back
            </SlayButton>
          </div>
        </Section>
      </AppContainer>
    );
  }

  const actionLabel = isLastTask ? (review ? "Finish Review" : "Finish Mission") : "Next";

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
              <span className="truncate text-[11px] font-bold uppercase tracking-[0.15em] text-white/50">
                {location.name}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <HowToPlayButton text={taskTypeInstructions(currentTask.taskType)} />
            <span className="text-sm font-bold text-white/50 whitespace-nowrap">
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
              <SlayButton
                variant="pink"
                onClick={() => finishMission(rewardFractionRef.current)}
                loading={isSubmitting}
              >
                Try Again
              </SlayButton>
            </div>
          )}
        </Section>
      )}
    </AppContainer>
  );
}

