"use client";

import { useState, useTransition } from "react";

import { SlayButton } from "@/components/ui";
import { INPUT_CLASS, LABEL_CLASS } from "@/features/admin/formStyles";
import { useAdminToast } from "@/features/admin/AdminToast";
import {
  clampGrammarPointCount,
  defaultGrammarTaskCount,
  describeGrammarTask,
  MAX_GRAMMAR_POINTS,
  type GrammarDraftTask,
} from "@/features/homework/grammar";

import GrammarPointEditor, { type DraftGrammarPoint } from "./GrammarPointEditor";
import { clearGrammar, generateGrammarDraft, publishGrammar } from "./grammarActions";

export interface GrammarManagerInitialPoint {
  title: string;
  explanation: string;
  example: string | null;
}

export interface GrammarManagerProps {
  topicId: string;
  topicTitle: string;
  topicDescription: string | null;
  initialPoints: GrammarManagerInitialPoint[];
  /** The test tasks the published set currently has, for the preview + baseline. */
  initialTasks: GrammarDraftTask[];
}

let keySeq = 0;
const nextKey = () => `g${keySeq++}`;

function toDraft(p: GrammarManagerInitialPoint): DraftGrammarPoint {
  return {
    key: nextKey(),
    title: p.title,
    explanation: p.explanation,
    example: p.example ?? "",
  };
}

function blankDraft(): DraftGrammarPoint {
  return { key: nextKey(), title: "", explanation: "", example: "" };
}

/**
 * A stable fingerprint of everything Publish sends — the points and the test
 * tasks. Comparing the current fingerprint to the last published one tells us
 * whether anything changed since the last submit, to disable Publish.
 */
function publishSignature(points: DraftGrammarPoint[], tasks: GrammarDraftTask[]): string {
  const rows = points.map((p) => `${p.title}${p.explanation}${p.example}`).join("");
  const taskSig = tasks.map((t) => `${t.taskType}:${JSON.stringify(t.content)}`).join("");
  return `${rows}|${taskSig}`;
}

/**
 * The teacher's grammar authoring surface for one homework topic, the sibling
 * of {@link VocabularyManager}. One editable list of rule points (title,
 * explanation, example) plus an AI-generated test. "Generate with AI" drafts
 * both from the topic; the teacher reviews and edits, then Publish replaces the
 * topic's whole grammar set. Nothing hits the database until Publish.
 */
export default function GrammarManager({
  topicId,
  topicTitle,
  topicDescription,
  initialPoints,
  initialTasks,
}: GrammarManagerProps) {
  const toast = useAdminToast();
  const [points, setPoints] = useState<DraftGrammarPoint[]>(() => initialPoints.map(toDraft));
  const [tasks, setTasks] = useState<GrammarDraftTask[]>(() => initialTasks);
  // Count fields kept as raw text so the teacher can clear them while typing.
  const [pointCount, setPointCount] = useState<string>(String(initialPoints.length || 5));
  const [taskCount, setTaskCount] = useState<string>(
    String(initialTasks.length > 0 ? initialTasks.length : defaultGrammarTaskCount(initialPoints.length))
  );
  const [extra, setExtra] = useState("");
  const [publishedSig, setPublishedSig] = useState<string>(() =>
    publishSignature(initialPoints.map(toDraft), initialTasks)
  );

  const [generating, startGenerate] = useTransition();
  const [regenerating, startRegenerate] = useTransition();
  const [publishing, startPublish] = useTransition();

  const busy = generating || regenerating || publishing;
  const hasPublished = initialPoints.length > 0;

  const pointCountValue = clampGrammarPointCount(Number(pointCount));
  const taskCountValue = Math.max(0, Math.round(Number(taskCount) || 0));

  const currentSig = publishSignature(points, tasks);
  const dirty = currentSig !== publishedSig;

  function patchPoint(key: string, patch: Partial<DraftGrammarPoint>) {
    setPoints((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  function handleGenerate() {
    startGenerate(async () => {
      const result = await generateGrammarDraft({
        topicId,
        topicTitle,
        topicDescription,
        extraInstructions: extra.trim() || null,
        pointCount: pointCountValue,
        taskCount: taskCountValue,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPoints(
        result.points.map((p) => ({
          key: nextKey(),
          title: p.title,
          explanation: p.explanation,
          example: p.example ?? "",
        }))
      );
      setTasks(result.tasks);
      setTaskCount(String(result.tasks.length || defaultGrammarTaskCount(result.points.length)));
      toast.success(`Drafted ${result.points.length} grammar points and ${result.tasks.length} test tasks.`);
    });
  }

  function handleRegenerateTest() {
    startRegenerate(async () => {
      // Re-draft and keep only the fresh test tasks, leaving the teacher's
      // edited points in place.
      const result = await generateGrammarDraft({
        topicId,
        topicTitle,
        topicDescription,
        extraInstructions: extra.trim() || null,
        pointCount: pointCountValue,
        taskCount: taskCountValue,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setTasks(result.tasks);
      toast.success(`Regenerated ${result.tasks.length} test tasks.`);
    });
  }

  function handlePublish() {
    const ready = points.filter((p) => p.title.trim() && p.explanation.trim());
    if (ready.length === 0) {
      toast.error("Add at least one grammar point with an explanation first.");
      return;
    }
    startPublish(async () => {
      const result = await publishGrammar({
        topicId,
        points: ready.map((p) => ({
          title: p.title,
          explanation: p.explanation,
          example: p.example.trim() || null,
        })),
        tasks,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPublishedSig(publishSignature(points, tasks));
      toast.success("Grammar published to this topic.");
    });
  }

  function handleClear() {
    if (!window.confirm("Remove all grammar points and the test from this topic?")) return;
    startPublish(async () => {
      const result = await clearGrammar(topicId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPoints([]);
      setTasks([]);
      setPublishedSig(publishSignature([], []));
      toast.success("Grammar removed from this topic.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* AI generation controls */}
      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
        <span className={LABEL_CLASS}>Generate with AI</span>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-white/50">Rule points</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_GRAMMAR_POINTS}
              value={pointCount}
              onChange={(e) => setPointCount(e.target.value.replace(/[^0-9]/g, ""))}
              className={`${INPUT_CLASS} !py-2 text-small`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-white/50">Test tasks</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_GRAMMAR_POINTS}
              value={taskCount}
              onChange={(e) => setTaskCount(e.target.value.replace(/[^0-9]/g, ""))}
              className={`${INPUT_CLASS} !py-2 text-small`}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-white/50">Extra instructions (optional)</span>
          <input
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="e.g. beginner level, focus on past tense"
            className={`${INPUT_CLASS} !py-2 text-small`}
          />
        </label>
        <SlayButton
          type="button"
          variant="pink"
          size="md"
          loading={generating}
          disabled={busy}
          onClick={handleGenerate}
        >
          {points.length > 0 ? "Regenerate Grammar with AI" : "Generate Grammar with AI"}
        </SlayButton>
      </div>

      {/* Point list */}
      {points.length > 0 && (
        <ul className="flex flex-col gap-2">
          {points.map((p, index) => (
            <GrammarPointEditor
              key={p.key}
              point={p}
              index={index}
              onChange={(patch) => patchPoint(p.key, patch)}
              onRemove={() => setPoints((prev) => prev.filter((x) => x.key !== p.key))}
            />
          ))}
        </ul>
      )}

      <SlayButton
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy || points.length >= MAX_GRAMMAR_POINTS}
        onClick={() => setPoints((prev) => [...prev, blankDraft()])}
      >
        + Add point manually
      </SlayButton>

      {/* Test preview — the AI-generated test Publish will attach. */}
      {points.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className={LABEL_CLASS}>
              Test preview ({tasks.length} task{tasks.length === 1 ? "" : "s"})
            </span>
            <button
              type="button"
              onClick={handleRegenerateTest}
              disabled={busy}
              className="rounded-md bg-purple/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white disabled:opacity-40"
            >
              {regenerating ? "Regenerating…" : "Regenerate test"}
            </button>
          </div>
          {tasks.length === 0 ? (
            <p className="text-[11px] text-white/40">
              No test yet — generate with AI or set test tasks above.
            </p>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {tasks.map((task, i) => {
                const { label, detail } = describeGrammarTask(task.taskType, task.content);
                return (
                  <li key={i} className="flex items-start gap-2 text-small text-white/80">
                    <span className="mt-0.5 shrink-0 rounded bg-purple/25 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      {label}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-white/60">{detail}</span>
                  </li>
                );
              })}
            </ol>
          )}
          <p className="text-[11px] text-white/30">
            Publishing replaces this topic&apos;s current grammar test with the one above.
          </p>
        </div>
      )}

      {/* Publish / clear */}
      <div className="flex gap-2">
        <SlayButton
          type="button"
          variant="green"
          size="md"
          className="flex-1"
          loading={publishing}
          disabled={busy || points.length === 0 || !dirty}
          onClick={handlePublish}
        >
          {dirty ? "Publish to Topic" : "Published"}
        </SlayButton>
        {hasPublished && (
          <SlayButton type="button" variant="ghost" size="md" disabled={busy} onClick={handleClear}>
            Clear
          </SlayButton>
        )}
      </div>
    </div>
  );
}
