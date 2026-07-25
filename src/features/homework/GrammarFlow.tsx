"use client";

import { useState, useTransition } from "react";

import { AppContainer, Section } from "@/components/layout";
import { SlayButton, XpAmount } from "@/components/ui";
import HowToPlayButton from "@/features/mission/HowToPlayButton";
import ProgressBar from "@/features/mission/ProgressBar";
import TaskRunner from "@/features/mission/TaskRunner";
import {
  taskTypeInstructions,
  type MissionTaskType,
  type MissionTaskViewModel,
} from "@/features/mission/types";

import { completeHomeworkGrammar } from "./actions";
import GrammarCard from "./GrammarCard";
import type { HomeworkGrammarPoint } from "./grammar";

/** Task types that take over the whole panel and manage their own layout/progress. */
const IMMERSIVE_TASK_TYPES: MissionTaskType[] = ["snake_game", "bubble_pop"];

export interface GrammarFlowProps {
  topicId: string;
  topicTitle: string;
  points: HomeworkGrammarPoint[];
  /** The test tasks that check the rules. */
  tasks: MissionTaskViewModel[];
  /** Whether the student has already passed this topic's grammar before. */
  alreadyPassed: boolean;
  /** Return to the topic's intro screen. */
  onExit: () => void;
}

type FlowMode = "intro" | "cards" | "test" | "done";

/**
 * The student's grammar learning flow for one topic, the sibling of
 * {@link VocabularyFlow}: step through every rule card (title, explanation,
 * example), then take the AI-built test. Finishing the whole flow records a
 * pass (`completeHomeworkGrammar`) that both the student and the teacher can see,
 * and grants XP for a first-time pass (coins stay mission-driven).
 */
export default function GrammarFlow({
  topicId,
  topicTitle,
  points,
  tasks,
  alreadyPassed,
  onExit,
}: GrammarFlowProps) {
  const [mode, setMode] = useState<FlowMode>("intro");
  const [cardIndex, setCardIndex] = useState(0);
  const [taskIndex, setTaskIndex] = useState(0);
  const [passed, setPassed] = useState(alreadyPassed);
  const [xpEarned, setXpEarned] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  const totalCards = points.length;
  const totalTasks = tasks.length;
  const currentPoint = points[cardIndex];
  const currentTask = tasks[taskIndex];

  const savePass = () => {
    setError(null);
    startSave(async () => {
      const result = await completeHomeworkGrammar(topicId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPassed(true);
      setXpEarned(result.xpEarned);
    });
  };

  const startFlow = () => {
    setCardIndex(0);
    setTaskIndex(0);
    setMode("cards");
  };

  const handleCardNext = () => {
    if (cardIndex < totalCards - 1) {
      setCardIndex((i) => i + 1);
      return;
    }
    // Last card done → test, or finish now if there are no test tasks.
    if (totalTasks > 0) {
      setMode("test");
    } else {
      savePass();
      setMode("done");
    }
  };

  const handleTaskComplete = () => {
    if (taskIndex < totalTasks - 1) {
      setTaskIndex((i) => i + 1);
      return;
    }
    savePass();
    setMode("done");
  };

  /* ── Intro ─────────────────────────────────────────────────────────────── */
  if (mode === "intro") {
    return (
      <AppContainer>
        <Section pt="lg" pb="sm">
          <button
            type="button"
            onClick={onExit}
            className="mb-2 inline-block text-left text-small text-white/50 hover:text-white"
          >
            ← {topicTitle}
          </button>
          <h1 className="text-h2 font-black text-white">Learn the Grammar</h1>
          <p className="mt-1 text-small text-white/60">
            {totalCards} rule{totalCards === 1 ? "" : "s"} to study, then a {totalTasks}-task test.
          </p>
        </Section>

        <Section py="sm" className="gap-4">
          {passed && (
            <div className="flex items-center gap-2 rounded-2xl border border-lime-green/30 bg-lime-green/10 px-4 py-3">
              <span className="text-xl">✓</span>
              <p className="text-small font-bold text-lime-green">You&apos;ve passed this grammar.</p>
            </div>
          )}
          <SlayButton variant="green" size="lg" onClick={startFlow}>
            {passed ? "Study Again" : "Start"}
          </SlayButton>
        </Section>
      </AppContainer>
    );
  }

  /* ── Rule cards ────────────────────────────────────────────────────────── */
  if (mode === "cards" && currentPoint) {
    const isLastCard = cardIndex === totalCards - 1;
    return (
      <AppContainer fixedHeight>
        <Section pt="lg" pb="sm" className="shrink-0 gap-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onExit}
              aria-label="Exit"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <span className="truncate text-[11px] font-bold uppercase tracking-[0.15em] text-white/50">
              Rule {cardIndex + 1} of {totalCards}
            </span>
            <span className="text-sm font-bold text-white/50">
              {cardIndex + 1}/{totalCards}
            </span>
          </div>
          <ProgressBar completed={cardIndex} total={totalCards} />
        </Section>

        <Section py="sm" className="min-h-0 flex-1 overflow-y-auto">
          <GrammarCard
            key={currentPoint.id}
            point={currentPoint}
            onNext={handleCardNext}
            actionLabel={isLastCard ? (totalTasks > 0 ? "Start Test" : "Finish") : "Next"}
          />
        </Section>
      </AppContainer>
    );
  }

  /* ── Test ──────────────────────────────────────────────────────────────── */
  if (mode === "test" && currentTask) {
    const isLastTask = taskIndex === totalTasks - 1;
    return (
      <AppContainer fixedHeight>
        <Section pt="lg" pb="sm" className="shrink-0 gap-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onExit}
              aria-label="Exit"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <span className="truncate text-[11px] font-bold uppercase tracking-[0.15em] text-white/50">
              Grammar Test
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <HowToPlayButton text={taskTypeInstructions(currentTask.taskType)} />
              <span className="text-sm font-bold text-white/50">
                {taskIndex + 1}/{totalTasks}
              </span>
            </div>
          </div>
          {!IMMERSIVE_TASK_TYPES.includes(currentTask.taskType) && (
            <ProgressBar completed={taskIndex} total={totalTasks} />
          )}
        </Section>

        <Section py="sm" className="min-h-0 flex-1 overflow-y-auto">
          <TaskRunner
            key={currentTask.id}
            taskType={currentTask.taskType}
            content={currentTask.content}
            actionLabel={isLastTask ? "Finish" : "Next"}
            onComplete={handleTaskComplete}
          />
        </Section>
      </AppContainer>
    );
  }

  /* ── Done ──────────────────────────────────────────────────────────────── */
  return (
    <AppContainer>
      <Section pt="lg" className="items-center gap-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-green/15 text-3xl">
          🎉
        </span>
        <h1 className="text-h2 font-black text-white">Grammar passed!</h1>
        <p className="text-white/60">
          {isSaving
            ? "Saving your progress…"
            : "You studied every rule and finished the test. Your teacher can see it too."}
        </p>
        {!isSaving && xpEarned > 0 && (
          <XpAmount
            value={`+${xpEarned} XP`}
            label={`Earned ${xpEarned} XP`}
            className="rounded-full bg-cyan/10 px-4 py-1.5 text-base"
          />
        )}
        {error && <p className="text-center text-neon-pink">{error}</p>}
        <div className="flex w-full gap-2">
          <SlayButton variant="green" className="flex-1" onClick={startFlow}>
            Study Again
          </SlayButton>
          <SlayButton variant="ghost" className="flex-1" onClick={onExit}>
            Back to Topic
          </SlayButton>
        </div>
      </Section>
    </AppContainer>
  );
}
