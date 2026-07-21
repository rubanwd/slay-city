"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AppContainer, Section } from "@/components/layout";
import { SlayButton } from "@/components/ui";
import NavLink from "@/components/ui/NavLink";
import HowToPlayButton from "@/features/mission/HowToPlayButton";
import ProgressBar from "@/features/mission/ProgressBar";
import TaskRunner from "@/features/mission/TaskRunner";
import { taskTypeInstructions, type MissionTaskType, type MissionTaskViewModel } from "@/features/mission/types";

import { completeHomeworkTask } from "./actions";
import VocabularyFlow from "./VocabularyFlow";
import type { HomeworkWord } from "./vocabulary";

/** Task types that take over the whole panel and manage their own layout/progress. */
const IMMERSIVE_TASK_TYPES: MissionTaskType[] = ["snake_game", "bubble_pop"];

export interface HomeworkTopicNote {
  text: string | null;
  linkUrl: string | null;
  imageUrl: string | null;
}

/** The optional vocabulary set attached to a topic — words to learn plus a test. */
export interface HomeworkTopicVocab {
  words: HomeworkWord[];
  tasks: MissionTaskViewModel[];
  /** Whether the child has already passed the vocabulary flow for this topic. */
  passed: boolean;
}

export interface HomeworkTopicScreenProps {
  topic: { id: string; title: string; description: string | null };
  /** Extra context the teacher attached — text, a link, and/or an image, all optional. */
  note: HomeworkTopicNote;
  tasks: MissionTaskViewModel[];
  /** Task ids the child has already completed, so a resumed topic picks up where they left off. */
  completedTaskIds: string[];
  /** Vocabulary learning set, when the teacher attached one. */
  vocab?: HomeworkTopicVocab;
}

type ScreenMode = "intro" | "running" | "finished" | "vocab";

function firstIncompleteIndex(tasks: MissionTaskViewModel[], completed: Set<string>): number {
  const index = tasks.findIndex((task) => !completed.has(task.id));
  return index === -1 ? 0 : index;
}

function TopicNoteCard({ note }: { note: HomeworkTopicNote }) {
  if (!note.text && !note.linkUrl && !note.imageUrl) return null;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-4">
      {note.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- teacher-uploaded topic note image
        <img src={note.imageUrl} alt="" className="w-full rounded-xl object-cover" />
      )}
      {note.text && <p className="whitespace-pre-wrap text-small text-white/70">{note.text}</p>}
      {note.linkUrl && (
        <a
          href={note.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-small font-bold text-cyan hover:underline"
        >
          {note.linkUrl}
        </a>
      )}
    </div>
  );
}

/**
 * Runs a homework topic's tasks one at a time, mirroring `MissionScreen`, but
 * with three deliberate differences: it opens on an intro screen (teacher's
 * note plus progress and a Start/Continue button) rather than jumping
 * straight into the first task; completion is saved after *every* task (not
 * just the last one), so leaving mid-topic keeps progress; and finishing
 * grants no XP/coins — homework sits outside the map's reward loop.
 */
export default function HomeworkTopicScreen({
  topic,
  note,
  tasks,
  completedTaskIds,
  vocab,
}: HomeworkTopicScreenProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState<Set<string>>(() => new Set(completedTaskIds));
  const [currentIndex, setCurrentIndex] = useState(() =>
    firstIncompleteIndex(tasks, new Set(completedTaskIds))
  );
  const [mode, setMode] = useState<ScreenMode>("intro");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isNavigating, startNav] = useTransition();

  const goToHomework = () => startNav(() => router.push("/homework"));

  const total = tasks.length;
  const currentTask = tasks[currentIndex];
  const isLastTask = currentIndex === total - 1;
  const allDone = total > 0 && completed.size >= total;
  const hasVocab = Boolean(vocab && vocab.words.length > 0);

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
        setMode("finished");
      } else {
        setCurrentIndex((index) => index + 1);
      }
    });
  };

  const handleExit = () => {
    if (window.confirm("Leave this topic? Your progress on this task will be lost.")) {
      goToHomework();
    }
  };

  const startPractice = (fromScratch: boolean) => {
    if (fromScratch) setCurrentIndex(0);
    setMode("running");
  };

  if (mode === "vocab" && vocab) {
    return (
      <VocabularyFlow
        topicId={topic.id}
        topicTitle={topic.title}
        words={vocab.words}
        tasks={vocab.tasks}
        alreadyPassed={vocab.passed}
        onExit={() => setMode("intro")}
      />
    );
  }

  if (total === 0 && !hasVocab) {
    return (
      <AppContainer className="justify-center">
        <Section className="items-center gap-4 text-center">
          <h1 className="text-h2 font-black text-white">{topic.title}</h1>
          <p className="text-white/60">This topic has no tasks yet.</p>
          <SlayButton variant="ghost" loading={isNavigating} onClick={goToHomework}>
            Back to Homework
          </SlayButton>
        </Section>
      </AppContainer>
    );
  }

  if (mode === "intro") {
    return (
      <AppContainer>
        <Section pt="lg" pb="sm">
          <NavLink
            href="/homework"
            className="mb-2 inline-block text-left text-small text-white/50 hover:text-white"
          >
            ← Homework
          </NavLink>
          <h1 className="text-h2 font-black text-white">{topic.title}</h1>
          {topic.description && <p className="mt-1 text-small text-white/60">{topic.description}</p>}
        </Section>

        <Section py="sm" className="gap-4">
          <TopicNoteCard note={note} />

          {hasVocab && vocab && (
            <button
              type="button"
              onClick={() => setMode("vocab")}
              className="flex items-center justify-between gap-3 rounded-2xl border border-cyan/30 bg-cyan/5 px-4 py-4 text-left transition-colors hover:border-cyan/50"
            >
              <span className="flex min-w-0 flex-col">
                <span className="text-body-strong text-white">Learn the Words</span>
                <span className="mt-0.5 text-small text-white/50">
                  {vocab.words.length} word{vocab.words.length === 1 ? "" : "s"} + test
                </span>
              </span>
              <span
                className={[
                  "shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                  vocab.passed ? "bg-lime-green/15 text-lime-green" : "bg-cyan/15 text-cyan",
                ].join(" ")}
              >
                {vocab.passed ? "Passed ✓" : "Start"}
              </span>
            </button>
          )}

          {total > 0 && (
            <>
              <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-4">
                <ProgressBar completed={completed.size} total={total} />
              </div>

              <SlayButton variant="green" size="lg" onClick={() => startPractice(allDone)}>
                {allDone ? "Practice Again" : completed.size > 0 ? "Continue" : "Start"}
              </SlayButton>
            </>
          )}
        </Section>
      </AppContainer>
    );
  }

  if (mode === "finished") {
    return (
      <AppContainer className="justify-center">
        <Section className="items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-green/15 text-3xl">
            🎉
          </span>
          <h1 className="text-h2 font-black text-white">{topic.title} done!</h1>
          <p className="text-white/60">You finished every task in this topic.</p>
          <div className="flex w-full flex-col gap-2">
            <SlayButton variant="green" onClick={() => startPractice(true)}>
              Practice Again
            </SlayButton>
            <SlayButton variant="ghost" loading={isNavigating} onClick={goToHomework}>
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
