"use client";

import { useState, useTransition } from "react";

import { SlayButton } from "@/components/ui";
import { INPUT_CLASS, LABEL_CLASS } from "@/features/admin/formStyles";
import { useAdminToast } from "@/features/admin/AdminToast";
import { uploadContentImage } from "@/features/admin/uploadContentImage";
import { clampWordCount, defaultTestTaskCount, MAX_VOCAB_WORDS } from "@/features/homework/vocabulary";

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
  const [taskCount, setTaskCount] = useState<number>(
    initialTaskCount > 0 ? initialTaskCount : defaultTestTaskCount(initialWords.length)
  );
  const [wordCount, setWordCount] = useState<number>(initialWords.length || 6);
  const [extra, setExtra] = useState("");
  const [busyImages, setBusyImages] = useState<Set<string>>(new Set());

  const [generating, startGenerate] = useTransition();
  const [publishing, startPublish] = useTransition();

  const hasPublished = initialWords.length > 0;

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

  function handleGenerateDraft() {
    startGenerate(async () => {
      const result = await generateVocabularyDraft({
        topicId,
        topicTitle,
        topicDescription,
        extraInstructions: extra.trim() || null,
        wordCount: clampWordCount(wordCount),
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
      setTaskCount(defaultTestTaskCount(drafted.length));
      toast.success(`Drafted ${drafted.length} words. Review, add images, then publish.`);
    });
  }

  async function handleGenerateImage(word: DraftWord) {
    if (busyImages.has(word.key)) return;
    setImageBusy(word.key, true);
    const result = await generateWordImage({
      topicId,
      word: word.word,
      imagePrompt: word.imagePrompt,
    });
    setImageBusy(word.key, false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    patchWord(word.key, { imageDataUrl: result.dataUrl });
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
          taskCount,
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
              min={1}
              max={MAX_VOCAB_WORDS}
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              className={`${INPUT_CLASS} !py-2 text-small`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-white/50">Test tasks</span>
            <input
              type="number"
              min={0}
              max={MAX_VOCAB_WORDS}
              value={taskCount}
              onChange={(e) => setTaskCount(Number(e.target.value))}
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
    </section>
  );
}
