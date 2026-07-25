"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AppContainer, Section } from "@/components/layout";
import { SlayButton } from "@/components/ui";
import NavLink from "@/components/ui/NavLink";
import type { MissionTaskViewModel } from "@/features/mission/types";

import GrammarFlow from "./GrammarFlow";
import TopicChat from "./qa/TopicChat";
import type { TopicMessage } from "./qa/queries";
import VocabularyFlow from "./VocabularyFlow";
import type { HomeworkGrammarPoint } from "./grammar";
import type { HomeworkWord } from "./vocabulary";

export interface HomeworkTopicNote {
  text: string | null;
  linkUrl: string | null;
  imageUrl: string | null;
}

/** The optional vocabulary set attached to a topic — words to learn plus a test. */
export interface HomeworkTopicVocab {
  words: HomeworkWord[];
  tasks: MissionTaskViewModel[];
  /** Whether the student has already passed the vocabulary flow for this topic. */
  passed: boolean;
}

/** The optional grammar set attached to a topic — rules to learn plus a test. */
export interface HomeworkTopicGrammar {
  points: HomeworkGrammarPoint[];
  tasks: MissionTaskViewModel[];
  /** Whether the student has already passed the grammar flow for this topic. */
  passed: boolean;
}

export interface HomeworkTopicScreenProps {
  topic: { id: string; title: string; description: string | null };
  /** Extra context the teacher attached — text, a link, and/or an image, all optional. */
  note: HomeworkTopicNote;
  /** The signed-in student's id — for the shared Q&A thread. */
  currentUserId: string;
  /** Server-rendered Q&A thread, kept live via Realtime inside `TopicChat`. */
  initialMessages: TopicMessage[];
  /** Vocabulary learning set, when the teacher attached one. */
  vocab?: HomeworkTopicVocab;
  /** Grammar learning set, when the teacher attached one. */
  grammar?: HomeworkTopicGrammar;
}

type ScreenMode = "intro" | "vocab" | "grammar";

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

/** One tappable learning-module card on the intro screen (vocabulary or grammar). */
function ModuleCard({
  title,
  subtitle,
  passed,
  onClick,
}: {
  title: string;
  subtitle: string;
  passed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between gap-3 rounded-2xl border border-cyan/30 bg-cyan/5 px-4 py-4 text-left transition-colors hover:border-cyan/50"
    >
      <span className="flex min-w-0 flex-col">
        <span className="text-body-strong text-white">{title}</span>
        <span className="mt-0.5 text-small text-white/50">{subtitle}</span>
      </span>
      <span
        className={[
          "shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
          passed ? "bg-lime-green/15 text-lime-green" : "bg-cyan/15 text-cyan",
        ].join(" ")}
      >
        {passed ? "Passed ✓" : "Start"}
      </span>
    </button>
  );
}

/**
 * The student's screen for one homework topic. A topic offers up to two learning
 * modules — Vocabulary ("Learn the Words") and Grammar ("Learn the Grammar") —
 * each launched from the intro screen into its own full-screen flow, plus a
 * shared Q&A thread with the group and teacher. Homework grants no XP/coins; it
 * sits outside the map's reward loop.
 */
export default function HomeworkTopicScreen({
  topic,
  note,
  currentUserId,
  initialMessages,
  vocab,
  grammar,
}: HomeworkTopicScreenProps) {
  const router = useRouter();
  const [mode, setMode] = useState<ScreenMode>("intro");
  const [isNavigating, startNav] = useTransition();

  const goToHomework = () => startNav(() => router.push("/homework"));

  const hasVocab = Boolean(vocab && vocab.words.length > 0);
  const hasGrammar = Boolean(grammar && grammar.points.length > 0);

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

  if (mode === "grammar" && grammar) {
    return (
      <GrammarFlow
        topicId={topic.id}
        topicTitle={topic.title}
        points={grammar.points}
        tasks={grammar.tasks}
        alreadyPassed={grammar.passed}
        onExit={() => setMode("intro")}
      />
    );
  }

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
          <ModuleCard
            title="Learn the Words"
            subtitle={`${vocab.words.length} word${vocab.words.length === 1 ? "" : "s"} + test`}
            passed={vocab.passed}
            onClick={() => setMode("vocab")}
          />
        )}

        {hasGrammar && grammar && (
          <ModuleCard
            title="Learn the Grammar"
            subtitle={`${grammar.points.length} rule${grammar.points.length === 1 ? "" : "s"} + test`}
            passed={grammar.passed}
            onClick={() => setMode("grammar")}
          />
        )}

        {!hasVocab && !hasGrammar && (
          <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center">
            <p className="text-small text-white/60">This topic has nothing to study yet.</p>
            <SlayButton
              variant="ghost"
              size="sm"
              className="mt-3"
              loading={isNavigating}
              onClick={goToHomework}
            >
              Back to Homework
            </SlayButton>
          </div>
        )}

        <div className="mt-2 flex flex-col gap-2">
          <h2 className="text-label uppercase tracking-widest text-white/50">Q&amp;A</h2>
          <p className="text-small text-white/40">
            Ask your teacher or leave a note — everyone in your group can see it.
          </p>
          <TopicChat
            topicId={topic.id}
            currentUserId={currentUserId}
            initialMessages={initialMessages}
          />
        </div>
      </Section>
    </AppContainer>
  );
}
