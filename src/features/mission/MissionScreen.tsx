"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AppContainer, Section } from "@/components/layout";
import { SlayButton } from "@/components/ui";

import { submitMissionCompletion } from "./actions";
import MatchingTask from "./MatchingTask";
import ProgressBar from "./ProgressBar";
import QuizTask from "./QuizTask";
import SnakeGameTask from "./SnakeGameTask";
import VocabularyTask from "./VocabularyTask";
import {
  parseMatchingContent,
  parseQuizContent,
  parseSnakeGameContent,
  parseVocabularyContent,
  type MissionTaskViewModel,
  type MissionViewModel,
} from "./types";

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

  const total = tasks.length;
  const currentTask = tasks[currentIndex];
  const isLastTask = currentIndex === total - 1;

  const finishMission = () => {
    setError(null);
    startSubmit(async () => {
      const result = await submitMissionCompletion(mission.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/mission/${mission.id}/reward`);
    });
  };

  const handleTaskComplete = () => {
    if (isLastTask) {
      finishMission();
    } else {
      setCurrentIndex((index) => index + 1);
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
    <AppContainer>
      <Section pt="lg" pb="sm" className="gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {location?.iconUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded location icon
              <img
                src={location.iconUrl}
                alt=""
                aria-hidden="true"
                className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-lime-green/60 shadow-[0_0_12px_rgba(157,255,0,0.35)]"
              />
            )}
            <div className="flex min-w-0 flex-col">
              {location && (
                <span className="truncate text-[11px] font-bold uppercase tracking-[0.15em] text-white/50">
                  {location.name}
                </span>
              )}
              <h1 className="truncate text-h3 font-black text-white">{mission.title}</h1>
            </div>
          </div>
          <span className="text-sm font-bold text-white/50 whitespace-nowrap">
            {currentIndex + 1}/{total}
          </span>
        </div>
        <ProgressBar completed={currentIndex} total={total} />
      </Section>

      <Section py="sm" className="flex-1">
        <MissionTaskRenderer
          key={currentTask.id}
          task={currentTask}
          actionLabel={actionLabel}
          onComplete={handleTaskComplete}
        />
      </Section>

      {(error || isSubmitting) && (
        <Section py="sm" className="items-center">
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

/* ── Task dispatcher ───────────────────────────────────────────────────────
 * Parses the task's JSONB content and renders the matching task component.
 * Unsupported task types or malformed content fall back to a skip card so a
 * single bad task never blocks the whole mission run.
 * ───────────────────────────────────────────────────────────────────────── */
function MissionTaskRenderer({
  task,
  onComplete,
  actionLabel,
}: {
  task: MissionTaskViewModel;
  onComplete: () => void;
  actionLabel: string;
}) {
  if (task.taskType === "vocabulary") {
    const content = parseVocabularyContent(task.content);
    if (content) {
      return <VocabularyTask content={content} onComplete={onComplete} actionLabel={actionLabel} />;
    }
  }

  if (task.taskType === "matching") {
    const content = parseMatchingContent(task.content);
    if (content) {
      return <MatchingTask content={content} onComplete={onComplete} actionLabel={actionLabel} />;
    }
  }

  if (task.taskType === "quiz") {
    const content = parseQuizContent(task.content);
    if (content) {
      return <QuizTask content={content} onComplete={onComplete} actionLabel={actionLabel} />;
    }
  }

  if (task.taskType === "snake_game") {
    const content = parseSnakeGameContent(task.content);
    if (content) {
      return <SnakeGameTask content={content} onComplete={onComplete} actionLabel={actionLabel} />;
    }
  }

  return <UnsupportedTask onComplete={onComplete} actionLabel={actionLabel} />;
}

function UnsupportedTask({
  onComplete,
  actionLabel,
}: {
  onComplete: () => void;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="text-white/60">This task type isn&apos;t available yet — skip ahead.</p>
      <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
