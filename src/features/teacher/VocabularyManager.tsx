"use client";

import { useMemo, useState, useTransition } from "react";

import { SlayButton } from "@/components/ui";
import { INPUT_CLASS, LABEL_CLASS } from "@/features/admin/formStyles";
import { useAdminToast } from "@/features/admin/AdminToast";
import { uploadContentImage } from "@/features/admin/uploadContentImage";
import {
  buildVocabTest,
  clampWordCount,
  defaultTestTaskCount,
  describeVocabTask,
  MAX_VOCAB_WORDS,
} from "@/features/homework/vocabulary";

import VocabWordEditor, { type DraftWord } from "./VocabWordEditor";
import {
  clearVocabulary,
  generateVocabularyDraft,
  generateWordImage,
  publishVocabulary,
} from "./vocabularyActions";

export interface VocabularyManagerInitialWord {
  word: string;
  transcription: string | null;
  translation: string;
  imageUrl: string | null;
}

export interface VocabularyManagerProps {
  topicId: string;
  topicTitle: string;
  topicDescription: string | null;
  initialWords: VocabularyManagerInitialWord[];
  /** How many test tasks the published set currently has (0 if none). */
  initialTaskCount: number;
}

let keySeq = 0;
const nextKey = () => `w${keySeq++}`;

/**
 * How many word images to generate at once in the background. Each image call
 * is slow (seconds), so a small pool keeps the whole set moving without firing
 * a dozen requests at the model at once.
 */
const IMAGE_CONCURRENCY = 3;

/** A word queued for background image generation. */
interface ImageTarget {
  key: string;
  word: string;
  imagePrompt: string | null;
}

/** Progress of the background image-generation run, shown in the bottom loader. */
interface ImageJob {
  total: number;
  done: number;
  failed: number;
}

function toDraft(w: VocabularyManagerInitialWord): DraftWord {
  return {
    key: nextKey(),
    word: w.word,
    transcription: w.transcription ?? "",
    translation: w.translation,
    imageUrl: w.imageUrl,
    imageDataUrl: null,
    imagePrompt: null,
  };
}

function blankDraft(): DraftWord {
  return {
    key: nextKey(),
    word: "",
    transcription: "",
    translation: "",
    imageUrl: null,
    imageDataUrl: null,
    imagePrompt: null,
  };
}

async function dataUrlToUpload(dataUrl: string): Promise<{ blob: Blob; ext: string }> {
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type === "image/jpeg" ? "jpg" : blob.type === "image/webp" ? "webp" : "png";
  return { blob, ext };
}

/**
 * The teacher's vocabulary authoring surface for one homework topic. One
 * editable list of words serves both authoring modes: fill it in by hand, or
 * populate it from the topic with AI (title + description + extra instructions
 * + word count). Each word gets an AI-generated or uploaded flashcard image.
 * Publishing replaces the topic's whole set and rebuilds its test — a set of
 * checking tasks equal to (by default) half the number of words.
 *
 * Nothing hits the database until Publish: AI results and images live in local
 * state so the teacher reviews first, exactly like the admin image flows.
 */
export default function VocabularyManager({
  topicId,
  topicTitle,
  topicDescription,
  initialWords,
  initialTaskCount,
}: VocabularyManagerProps) {
  const toast = useAdminToast();
  const [words, setWords] = useState<DraftWord[]>(() => initialWords.map(toDraft));
  // Count fields are kept as raw text so the teacher can clear them while
  // typing (a numeric state would snap an empty field back to 0). They're
  // parsed to numbers only where used, below.
  const [taskCount, setTaskCount] = useState<string>(
    String(initialTaskCount > 0 ? initialTaskCount : defaultTestTaskCount(initialWords.length))
  );
  const [wordCount, setWordCount] = useState<string>(String(initialWords.length || 6));
  const [testSeed, setTestSeed] = useState(0);
  const [extra, setExtra] = useState("");
  const [busyImages, setBusyImages] = useState<Set<string>>(new Set());
  const [imageJob, setImageJob] = useState<ImageJob | null>(null);

  const [generating, startGenerate] = useTransition();
  const [publishing, startPublish] = useTransition();

  const hasPublished = initialWords.length > 0;

  // Requested test size, parsed from the raw text (empty/invalid → 0).
  const taskCountValue = Math.max(0, Math.round(Number(taskCount) || 0));

  // Live preview of the test that Publish will build: derived from the current
  // words, the requested task count and the chosen variant, using the exact
  // same builder the server runs — so what the teacher sees is what publishes.
  const previewTasks = useMemo(() => {
    const source = words
      .filter((w) => w.word.trim() && w.translation.trim())
      .map((w) => ({ word: w.word, translation: w.translation, imageUrl: w.imageUrl }));
    return buildVocabTest(source, taskCountValue, testSeed);
  }, [words, taskCountValue, testSeed]);

  function patchWord(key: string, patch: Partial<DraftWord>) {
    setWords((prev) => prev.map((w) => (w.key === key ? { ...w, ...patch } : w)));
  }

  function setImageBusy(key: string, busy: boolean) {
    setBusyImages((prev) => {
      const next = new Set(prev);
      if (busy) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  /**
   * Generates flashcard images for a batch of words in the background with a
   * small concurrency pool. Non-blocking: the caller does not await it, so the
   * teacher can keep editing while images stream in. Each finished image is
   * patched onto its word as soon as it arrives; progress drives the bottom
   * loader via {@link imageJob}. Words that are already busy or already have an
   * image are skipped, so it's safe to run after a manual regeneration too.
   */
  async function runBackgroundImages(targets: ImageTarget[]) {
    const pending = targets.filter((t) => t.word.trim());
    if (pending.length === 0) return;

    // Seed progress from any run already in flight so overlapping batches
    // (e.g. a regenerate mid-run) accumulate into one visible counter.
    setImageJob((prev) => ({
      total: (prev?.total ?? 0) + pending.length,
      done: prev?.done ?? 0,
      failed: prev?.failed ?? 0,
    }));

    let cursor = 0;
    let batchFailed = 0;
    async function worker() {
      while (cursor < pending.length) {
        const item = pending[cursor++];
        setImageBusy(item.key, true);
        const result = await generateWordImage({
          topicId,
          word: item.word,
          imagePrompt: item.imagePrompt,
        });
        setImageBusy(item.key, false);
        if (result.ok) patchWord(item.key, { imageUrl: result.imageUrl, imageDataUrl: null });
        else batchFailed++;
        setImageJob((prev) =>
          prev
            ? { total: prev.total, done: prev.done + 1, failed: prev.failed + (result.ok ? 0 : 1) }
            : prev
        );
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(IMAGE_CONCURRENCY, pending.length) }, () => worker())
    );

    // Clear the loader once this batch's slice of the counter is exhausted.
    setImageJob((prev) => (prev && prev.done >= prev.total ? null : prev));

    if (batchFailed > 0) {
      toast.error(
        `${batchFailed} image${batchFailed === 1 ? "" : "s"} couldn't be generated. Use the AI button to retry.`
      );
    }
  }

  function handleGenerateDraft() {
    startGenerate(async () => {
      const result = await generateVocabularyDraft({
        topicId,
        topicTitle,
        topicDescription,
        extraInstructions: extra.trim() || null,
        wordCount: clampWordCount(Number(wordCount)),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const drafted: DraftWord[] = result.words.map((w) => ({
        key: nextKey(),
        word: w.word,
        transcription: w.transcription ?? "",
        translation: w.translation,
        imageUrl: null,
        imageDataUrl: null,
        imagePrompt: w.imagePrompt,
      }));
      setWords(drafted);
      setTaskCount(String(defaultTestTaskCount(drafted.length)));
      setTestSeed(0);
      toast.success(`Drafted ${drafted.length} words. Generating images…`);
      // Fire-and-forget: images stream in while the teacher reviews the words.
      void runBackgroundImages(
        drafted.map((w) => ({ key: w.key, word: w.word, imagePrompt: w.imagePrompt }))
      );
    });
  }

  async function handleGenerateImage(word: DraftWord) {
    if (busyImages.has(word.key)) return;
    setImageBusy(word.key, true);
    // If the word already shows an image, the teacher wants a different one —
    // bypass the shared cache. A first-time generation reuses the library.
    const result = await generateWordImage({
      topicId,
      word: word.word,
      imagePrompt: word.imagePrompt,
      forceRegenerate: Boolean(word.imageUrl || word.imageDataUrl),
    });
    setImageBusy(word.key, false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    patchWord(word.key, { imageUrl: result.imageUrl, imageDataUrl: null });
  }

  async function handleUploadImage(word: DraftWord, file: File) {
    setImageBusy(word.key, true);
    try {
      const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/webp" ? "webp" : "png";
      const url = await uploadContentImage(file, "homework", ext);
      patchWord(word.key, { imageUrl: url, imageDataUrl: null });
    } catch {
      toast.error("Couldn't upload that image. Try another file.");
    } finally {
      setImageBusy(word.key, false);
    }
  }

  function handlePublish() {
    const ready = words.filter((w) => w.word.trim() && w.translation.trim());
    if (ready.length === 0) {
      toast.error("Add at least one word with a translation first.");
      return;
    }
    startPublish(async () => {
      try {
        // Upload any AI-preview images that aren't in storage yet.
        const uploaded = await Promise.all(
          words.map(async (w) => {
            if (w.imageDataUrl) {
              const { blob, ext } = await dataUrlToUpload(w.imageDataUrl);
              const url = await uploadContentImage(blob, "homework", ext);
              return { ...w, imageUrl: url, imageDataUrl: null };
            }
            return w;
          })
        );
        setWords(uploaded);

        const result = await publishVocabulary({
          topicId,
          words: uploaded
            .filter((w) => w.word.trim() && w.translation.trim())
            .map((w) => ({
              word: w.word,
              transcription: w.transcription,
              translation: w.translation,
              imageUrl: w.imageUrl,
            })),
          taskCount: taskCountValue,
          testSeed,
        });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Vocabulary published to this topic.");
      } catch {
        toast.error("Something went wrong while publishing. Try again.");
      }
    });
  }

  function handleClear() {
    if (!window.confirm("Remove all vocabulary words and the test from this topic?")) return;
    startPublish(async () => {
      const result = await clearVocabulary(topicId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setWords([]);
      toast.success("Vocabulary removed from this topic.");
    });
  }

  const busy = generating || publishing;

  return (
    <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-purple/30 bg-purple/5 p-4">
      <div>
        <h2 className="text-body-strong text-white">Vocabulary Learning</h2>
        <p className="mt-0.5 text-small text-white/50">
          Words the group learns as flashcards, plus an auto-built test to check them.
        </p>
      </div>

      {/* AI generation controls */}
      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
        <span className={LABEL_CLASS}>Generate with AI</span>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-white/50">Words</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_VOCAB_WORDS}
              value={wordCount}
              onChange={(e) => setWordCount(e.target.value.replace(/[^0-9]/g, ""))}
              className={`${INPUT_CLASS} !py-2 text-small`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-white/50">Test tasks</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_VOCAB_WORDS}
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
            placeholder="e.g. beginner level, only nouns"
            className={`${INPUT_CLASS} !py-2 text-small`}
          />
        </label>
        <SlayButton
          type="button"
          variant="pink"
          size="md"
          loading={generating}
          disabled={busy}
          onClick={handleGenerateDraft}
        >
          {words.length > 0 ? "Regenerate Words with AI" : "Generate Words with AI"}
        </SlayButton>
      </div>

      {/* Word list */}
      {words.length > 0 && (
        <ul className="flex flex-col gap-2">
          {words.map((w, index) => (
            <VocabWordEditor
              key={w.key}
              word={w}
              index={index}
              imageBusy={busyImages.has(w.key)}
              onChange={(patch) => patchWord(w.key, patch)}
              onRemove={() => setWords((prev) => prev.filter((x) => x.key !== w.key))}
              onGenerateImage={() => handleGenerateImage(w)}
              onUploadImage={(file) => handleUploadImage(w, file)}
            />
          ))}
        </ul>
      )}

      <SlayButton
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy || words.length >= MAX_VOCAB_WORDS}
        onClick={() => setWords((prev) => [...prev, blankDraft()])}
      >
        + Add word manually
      </SlayButton>

      {/* Test preview — the deterministic test Publish will build from the words
          above. Regenerating reshuffles it into a different, still-valid set. */}
      {words.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className={LABEL_CLASS}>
              Test preview ({previewTasks.length} task{previewTasks.length === 1 ? "" : "s"})
            </span>
            <button
              type="button"
              onClick={() => setTestSeed((s) => s + 1)}
              disabled={busy || previewTasks.length === 0}
              className="rounded-md bg-purple/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white disabled:opacity-40"
            >
              Regenerate test
            </button>
          </div>
          {previewTasks.length === 0 ? (
            <p className="text-[11px] text-white/40">
              {taskCountValue === 0
                ? "Test tasks set to 0 — no test will be built."
                : "Add a word with a translation to build the test."}
            </p>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {previewTasks.map((task, i) => {
                const { label, detail } = describeVocabTask(task.taskType, task.content);
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
            Publishing replaces this topic&apos;s current test with the one above.
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
          disabled={busy || busyImages.size > 0 || words.length === 0}
          onClick={handlePublish}
        >
          Publish to Topic
        </SlayButton>
        {hasPublished && (
          <SlayButton type="button" variant="ghost" size="md" disabled={busy} onClick={handleClear}>
            Clear
          </SlayButton>
        )}
      </div>
      {busyImages.size > 0 && (
        <p className="text-center text-[11px] text-white/40">Finish generating images before publishing…</p>
      )}

      {/* Background image-generation progress — floats at the bottom while the
          pool works, so the teacher can scroll and edit words meanwhile. */}
      {imageJob && imageJob.total > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-5"
        >
          <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border border-purple/50 bg-[#1a1a1a]/95 px-4 py-3 shadow-lg backdrop-blur">
            <span
              aria-hidden="true"
              className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/20 border-t-purple"
            />
            <div className="min-w-0 flex-1">
              <p className="text-small font-semibold text-white">
                Generating word images… {Math.min(imageJob.done + 1, imageJob.total)}/{imageJob.total}
              </p>
              {imageJob.failed > 0 && (
                <p className="text-[11px] text-neon-pink">
                  {imageJob.failed} failed — use the AI button to retry
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
