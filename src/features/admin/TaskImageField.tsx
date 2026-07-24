"use client";

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import ImageUploadField from "./ImageUploadField";
import { generateTaskImage, recordTaskImage } from "./generateTaskImage";
import { uploadContentImage } from "./uploadContentImage";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";

export interface TaskImageFieldProps {
  label: string;
  /** Current public image URL ("" when none). */
  value: string;
  onChange: (url: string) => void;
  /** The word/answer the picture should depict — anchors the AI prompt. */
  subject: string;
  /** Optional extra context for the prompt (e.g. a translation). */
  context?: string | null;
  hint?: string;
  /** Shown when the image is required for the task to play. */
  required?: boolean;
}

/** One AI attempt. `uploadedUrl` is set once it has been pushed to storage. */
interface Candidate {
  dataUrl: string;
  uploadedUrl?: string;
}

type Source = "upload" | "ai";

/** Turns a model-returned data URL into a blob plus the extension for storage. */
async function dataUrlToUpload(dataUrl: string): Promise<{ blob: Blob; ext: string }> {
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type === "image/jpeg" ? "jpg" : blob.type === "image/webp" ? "webp" : "png";
  return { blob, ext };
}

const TAB_BASE =
  "flex-1 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors";

/**
 * Image picker for a single task-content image slot. The admin either uploads
 * artwork by hand or generates it with AI from the task's word/answer — the
 * task-editor twin of {@link LocationIconField}. Controlled: the parent editor
 * owns the URL and mirrors it into the task's JSON content.
 *
 * An AI attempt only reaches storage when the admin presses "Use this one", so
 * regenerating stays cheap. An unpicked attempt lives only in the browser; a
 * persistent hint warns that it will be lost if not applied (there is no
 * form-submit guard here, so the control can nest inside item lists).
 */
export default function TaskImageField({
  label,
  value,
  onChange,
  subject,
  context,
  hint,
  required,
}: TaskImageFieldProps) {
  const [source, setSource] = useState<Source>(value ? "upload" : "ai");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [index, setIndex] = useState(0);
  const [extraInstructions, setExtraInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reused, setReused] = useState(false);

  const current = candidates[index];
  const isApplied = Boolean(current?.uploadedUrl && current.uploadedUrl === value);
  const busy = generating || applying;
  const hasUnpickedAttempt = candidates.length > 0 && !isApplied;

  async function handleGenerate() {
    if (!subject.trim()) {
      setError("Fill in the word or answer first — the picture is built from it.");
      return;
    }
    setGenerating(true);
    setError(null);
    setReused(false);
    // First "Generate" reuses the shared library; "Regenerate" forces a fresh one.
    const forceRegenerate = candidates.length > 0;
    const nextIndex = candidates.length;
    const result = await generateTaskImage({ subject, context, extraInstructions, forceRegenerate });
    if (!result.ok) {
      setError(result.error);
    } else if (result.cached) {
      // A ready public URL from the library — apply it straight away, no upload.
      onChange(result.imageUrl);
      setReused(true);
    } else {
      setCandidates((prev) => [...prev, { dataUrl: result.dataUrl }]);
      setIndex(nextIndex);
    }
    setGenerating(false);
  }

  async function handleApply() {
    if (!current) return;
    if (current.uploadedUrl) {
      onChange(current.uploadedUrl);
      return;
    }
    setApplying(true);
    setError(null);
    try {
      const { blob, ext } = await dataUrlToUpload(current.dataUrl);
      const publicUrl = await uploadContentImage(blob, "tasks", ext);
      setCandidates((prev) => prev.map((c, i) => (i === index ? { ...c, uploadedUrl: publicUrl } : c)));
      onChange(publicUrl);
      // Record in the shared library so the same subject is free next time.
      void recordTaskImage(subject, publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that image.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className={LABEL_CLASS}>{label}</span>
        {required && !value && (
          <span className="rounded-md bg-neon-pink/20 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-neon-pink">
            Needs image
          </span>
        )}
      </div>

      {/* ── Source switch ──────────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Image source"
        className="flex gap-1 rounded-xl border border-white/15 bg-white/5 p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={source === "upload"}
          onClick={() => setSource("upload")}
          className={[TAB_BASE, source === "upload" ? "bg-white/15 text-white" : "text-white/50 hover:text-white/80"].join(" ")}
        >
          Upload
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={source === "ai"}
          onClick={() => setSource("ai")}
          className={[TAB_BASE, source === "ai" ? "bg-white/15 text-white" : "text-white/50 hover:text-white/80"].join(" ")}
        >
          Generate with AI
        </button>
      </div>

      {source === "upload" ? (
        <ImageUploadField folder="tasks" value={value} onChange={onChange} />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center py-1">
            <div className="relative h-32 w-32 overflow-hidden rounded-2xl border border-white/15 bg-white/5">
              {current || value ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current?.dataUrl ?? value}
                  alt={current ? `AI image attempt ${index + 1}` : "Current image"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-white/30">
                  {generating ? "Generating…" : "No image yet"}
                </span>
              )}
              {busy && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <span className="text-xs font-bold text-lime-green">
                    {generating ? "Generating…" : "Saving…"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {!busy && current && (
            <p className="text-center text-[11px] font-black uppercase tracking-wide">
              {isApplied ? (
                <span className="text-lime-green">Selected</span>
              ) : (
                <span className="text-neon-pink">Not used yet</span>
              )}
            </p>
          )}

          {candidates.length > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0 || busy}
                className="rounded-full border border-white/20 px-3 py-1 text-xs font-bold text-white/70 transition-colors hover:bg-white/10 disabled:opacity-30"
              >
                ‹ Prev
              </button>
              <span className="text-xs font-semibold text-white/50">
                Attempt {index + 1} / {candidates.length}
              </span>
              <button
                type="button"
                onClick={() => setIndex((i) => Math.min(candidates.length - 1, i + 1))}
                disabled={index === candidates.length - 1 || busy}
                className="rounded-full border border-white/20 px-3 py-1 text-xs font-bold text-white/70 transition-colors hover:bg-white/10 disabled:opacity-30"
              >
                Next ›
              </button>
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Extra prompt details</span>
            <textarea
              rows={2}
              value={extraInstructions}
              onChange={(e) => setExtraInstructions(e.target.value)}
              placeholder="e.g. on a plain blue background, smiling"
              className={INPUT_CLASS}
            />
            <span className="text-xs text-white/40">
              The word/answer and a kid-friendly flashcard style are already in the prompt.
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <SlayButton
              type="button"
              variant="pink"
              size="sm"
              loading={generating}
              disabled={applying}
              onClick={handleGenerate}
            >
              {candidates.length === 0 ? "Generate" : "Regenerate"}
            </SlayButton>

            {current && !isApplied && (
              <SlayButton
                type="button"
                variant="green"
                size="sm"
                loading={applying}
                disabled={generating}
                onClick={handleApply}
              >
                Use this one
              </SlayButton>
            )}

            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                disabled={busy}
                className="text-xs font-semibold text-neon-pink hover:underline disabled:opacity-40"
              >
                Remove
              </button>
            )}
          </div>

          {hasUnpickedAttempt && !busy && (
            <p className="text-xs text-neon-pink">
              This attempt only exists in your browser. Press “Use this one” to keep it.
            </p>
          )}

          {reused && !busy && (
            <p className="text-xs text-lime-green">
              Reused an existing image for “{subject}” from the shared library. Press “Regenerate”
              for a fresh one.
            </p>
          )}
        </div>
      )}

      {hint && <span className="text-xs text-white/40">{hint}</span>}
      {error && (
        <p role="alert" className="text-sm font-semibold text-neon-pink">
          {error}
        </p>
      )}
    </div>
  );
}
