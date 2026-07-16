"use client";

import { useState } from "react";

import {
  parseMatchingContent,
  parseQuizContent,
  parseSnakeGameContent,
  parseVocabularyContent,
  type MatchingMode,
} from "@/features/mission/types";
import type { Json } from "@/types/database";

import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";
import type { MissionTaskType } from "./taskTypes";

const GUIDED_TYPES: MissionTaskType[] = ["vocabulary", "matching", "quiz", "snake_game"];

export interface AdminTaskContentFieldsProps {
  taskType: MissionTaskType;
  /** Existing content when editing a task of this same type. Omit for a new task. */
  initialContent?: Json;
}

function isRecord(value: Json | undefined): value is { [key: string]: Json } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Renders a guided, type-specific form for a task's content (with a raw-JSON
 * escape hatch), and mirrors whichever mode is active into a hidden
 * `content` field so the surrounding `<form>` still submits a single JSON
 * string, matching what `createMissionTask`/`updateMissionTask` expect.
 */
export default function AdminTaskContentFields({
  taskType,
  initialContent,
}: AdminTaskContentFieldsProps) {
  const supportsGuided = GUIDED_TYPES.includes(taskType);

  const initialVocab = taskType === "vocabulary" ? parseVocabularyContent(initialContent ?? null) : null;
  const initialMatching = taskType === "matching" ? parseMatchingContent(initialContent ?? null) : null;
  const initialQuiz = taskType === "quiz" ? parseQuizContent(initialContent ?? null) : null;
  const initialSnake = taskType === "snake_game" ? parseSnakeGameContent(initialContent ?? null) : null;

  const hasExistingContent = isRecord(initialContent) && Object.keys(initialContent).length > 0;
  const initialParseFailed =
    hasExistingContent &&
    supportsGuided &&
    !initialVocab &&
    !initialMatching &&
    !initialQuiz &&
    !initialSnake;

  const [mode, setMode] = useState<"guided" | "raw">(
    !supportsGuided || initialParseFailed ? "raw" : "guided"
  );
  const [rawJson, setRawJson] = useState(
    initialContent !== undefined ? JSON.stringify(initialContent, null, 2) : ""
  );

  const [word, setWord] = useState(initialVocab?.word ?? "");
  const [translation, setTranslation] = useState(initialVocab?.translation ?? "");
  const [imageUrl, setImageUrl] = useState(initialVocab?.imageUrl ?? "");
  const [exampleSentence, setExampleSentence] = useState(initialVocab?.exampleSentence ?? "");

  const [prompt, setPrompt] = useState(initialMatching?.prompt ?? "Match each word to its picture");
  const [matchMode, setMatchMode] = useState<MatchingMode>(initialMatching?.mode ?? "word-to-image");
  const [pairs, setPairs] = useState<{ word: string; match: string }[]>(
    initialMatching?.pairs.map((p) => ({ word: p.word, match: p.match })) ?? [
      { word: "", match: "" },
      { word: "", match: "" },
    ]
  );

  const [question, setQuestion] = useState(initialQuiz?.question ?? "");
  const [quizImageUrl, setQuizImageUrl] = useState(initialQuiz?.imageUrl ?? "");
  const [options, setOptions] = useState<string[]>(initialQuiz?.options ?? ["", ""]);
  const [correctIndex, setCorrectIndex] = useState(initialQuiz?.correctIndex ?? 0);

  const [snakeWord, setSnakeWord] = useState(initialSnake?.word ?? "");
  const [snakeTranslation, setSnakeTranslation] = useState(initialSnake?.translation ?? "");
  const [snakePrompt, setSnakePrompt] = useState(initialSnake?.prompt ?? "Collect the letters in order");

  function buildGuidedContent(): Record<string, unknown> {
    if (taskType === "vocabulary") {
      return { word, translation, imageUrl: imageUrl || null, exampleSentence: exampleSentence || null };
    }
    if (taskType === "matching") {
      return {
        prompt,
        mode: matchMode,
        pairs: pairs
          .filter((p) => p.word.trim() && p.match.trim())
          .map((p, i) => ({ id: String(i + 1), word: p.word, match: p.match })),
      };
    }
    if (taskType === "quiz") {
      return {
        question,
        imageUrl: quizImageUrl || null,
        options: options.filter((o) => o.trim()),
        correctIndex,
      };
    }
    if (taskType === "snake_game") {
      return {
        word: snakeWord,
        translation: snakeTranslation || null,
        prompt: snakePrompt,
      };
    }
    return {};
  }

  function switchToRaw() {
    setRawJson(JSON.stringify(buildGuidedContent(), null, 2));
    setMode("raw");
  }

  function switchToGuided() {
    try {
      const parsed = JSON.parse(rawJson || "{}");
      if (taskType === "vocabulary") {
        const c = parseVocabularyContent(parsed);
        if (c) {
          setWord(c.word);
          setTranslation(c.translation);
          setImageUrl(c.imageUrl ?? "");
          setExampleSentence(c.exampleSentence ?? "");
        }
      } else if (taskType === "matching") {
        const c = parseMatchingContent(parsed);
        if (c) {
          setPrompt(c.prompt);
          setMatchMode(c.mode);
          setPairs(c.pairs.map((p) => ({ word: p.word, match: p.match })));
        }
      } else if (taskType === "quiz") {
        const c = parseQuizContent(parsed);
        if (c) {
          setQuestion(c.question);
          setQuizImageUrl(c.imageUrl ?? "");
          setOptions(c.options);
          setCorrectIndex(c.correctIndex);
        }
      } else if (taskType === "snake_game") {
        const c = parseSnakeGameContent(parsed);
        if (c) {
          setSnakeWord(c.word);
          setSnakeTranslation(c.translation ?? "");
          setSnakePrompt(c.prompt);
        }
      }
    } catch {
      // Raw JSON didn't parse — keep whatever guided values were already set.
    }
    setMode("guided");
  }

  if (!supportsGuided) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Content (JSON)</span>
        <textarea
          name="content"
          rows={6}
          value={rawJson}
          onChange={(e) => setRawJson(e.target.value)}
          className={`${INPUT_CLASS} font-mono text-small`}
        />
        <span className="text-xs text-white/40">
          Listening tasks don&apos;t have a guided editor yet — enter content as JSON.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className={LABEL_CLASS}>Content</span>
        <button
          type="button"
          onClick={mode === "guided" ? switchToRaw : switchToGuided}
          className="text-xs font-bold uppercase tracking-wide text-cyan hover:underline"
        >
          {mode === "guided" ? "Edit as raw JSON" : "Use guided form"}
        </button>
      </div>

      {mode === "raw" ? (
        <textarea
          name="content"
          rows={8}
          value={rawJson}
          onChange={(e) => setRawJson(e.target.value)}
          className={`${INPUT_CLASS} font-mono text-small`}
        />
      ) : (
        <>
          <input type="hidden" name="content" value={JSON.stringify(buildGuidedContent())} readOnly />

          {taskType === "vocabulary" && (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LABEL_CLASS}>Word</span>
                <input value={word} onChange={(e) => setWord(e.target.value)} className={INPUT_CLASS} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL_CLASS}>Translation</span>
                <input
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  className={INPUT_CLASS}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL_CLASS}>Image URL</span>
                <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={INPUT_CLASS} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL_CLASS}>Example Sentence</span>
                <input
                  value={exampleSentence}
                  onChange={(e) => setExampleSentence(e.target.value)}
                  className={INPUT_CLASS}
                />
              </label>
            </div>
          )}

          {taskType === "matching" && (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LABEL_CLASS}>Prompt</span>
                <input value={prompt} onChange={(e) => setPrompt(e.target.value)} className={INPUT_CLASS} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL_CLASS}>Mode</span>
                <select
                  value={matchMode}
                  onChange={(e) => setMatchMode(e.target.value as MatchingMode)}
                  className={`${INPUT_CLASS} [&>option]:bg-[#1a1a1a] [&>option]:text-white`}
                >
                  <option value="word-to-image">Word to Image</option>
                  <option value="word-to-translation">Word to Translation</option>
                </select>
              </label>

              <div className="flex flex-col gap-2">
                <span className={LABEL_CLASS}>Pairs</span>
                {pairs.map((pair, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={pair.word}
                      onChange={(e) =>
                        setPairs((prev) => prev.map((p, idx) => (idx === i ? { ...p, word: e.target.value } : p)))
                      }
                      placeholder="Word"
                      className={INPUT_CLASS}
                    />
                    <input
                      value={pair.match}
                      onChange={(e) =>
                        setPairs((prev) => prev.map((p, idx) => (idx === i ? { ...p, match: e.target.value } : p)))
                      }
                      placeholder={matchMode === "word-to-image" ? "Image URL" : "Translation"}
                      className={INPUT_CLASS}
                    />
                    <button
                      type="button"
                      onClick={() => setPairs((prev) => prev.filter((_, idx) => idx !== i))}
                      disabled={pairs.length <= 2}
                      className="shrink-0 rounded-lg border border-white/20 px-2 py-2 text-xs text-white/60 hover:bg-white/10 disabled:opacity-30"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setPairs((prev) => [...prev, { word: "", match: "" }])}
                  className="self-start text-xs font-bold uppercase tracking-wide text-lime-green hover:underline"
                >
                  + Add pair
                </button>
              </div>
            </div>
          )}

          {taskType === "quiz" && (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LABEL_CLASS}>Question</span>
                <input value={question} onChange={(e) => setQuestion(e.target.value)} className={INPUT_CLASS} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL_CLASS}>Image URL</span>
                <input
                  value={quizImageUrl}
                  onChange={(e) => setQuizImageUrl(e.target.value)}
                  className={INPUT_CLASS}
                />
              </label>

              <div className="flex flex-col gap-2">
                <span className={LABEL_CLASS}>Options (select the correct one)</span>
                {options.map((option, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={correctIndex === i}
                      onChange={() => setCorrectIndex(i)}
                      aria-label={`Mark option ${i + 1} correct`}
                      className="h-4 w-4 shrink-0 accent-lime-green"
                    />
                    <input
                      value={option}
                      onChange={(e) =>
                        setOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))
                      }
                      placeholder={`Option ${i + 1}`}
                      className={INPUT_CLASS}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setOptions((prev) => prev.filter((_, idx) => idx !== i));
                        setCorrectIndex((prev) => (i === prev ? 0 : i < prev ? prev - 1 : prev));
                      }}
                      disabled={options.length <= 2}
                      className="shrink-0 rounded-lg border border-white/20 px-2 py-2 text-xs text-white/60 hover:bg-white/10 disabled:opacity-30"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setOptions((prev) => [...prev, ""])}
                  className="self-start text-xs font-bold uppercase tracking-wide text-lime-green hover:underline"
                >
                  + Add option
                </button>
              </div>
            </div>
          )}

          {taskType === "snake_game" && (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LABEL_CLASS}>Word to collect</span>
                <input
                  value={snakeWord}
                  onChange={(e) => setSnakeWord(e.target.value.toUpperCase())}
                  placeholder="CAT"
                  className={INPUT_CLASS}
                />
                <span className="text-xs text-white/40">
                  The child steers the snake over these letters in order. 3–8 letters works best.
                </span>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL_CLASS}>Translation (optional)</span>
                <input
                  value={snakeTranslation}
                  onChange={(e) => setSnakeTranslation(e.target.value)}
                  className={INPUT_CLASS}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL_CLASS}>Prompt</span>
                <input
                  value={snakePrompt}
                  onChange={(e) => setSnakePrompt(e.target.value)}
                  className={INPUT_CLASS}
                />
              </label>
            </div>
          )}
        </>

      )}
    </div>
  );
}
