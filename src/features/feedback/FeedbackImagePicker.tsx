"use client";

import { useRef, useState, type ChangeEvent } from "react";

import { uploadContentImage } from "@/features/admin/uploadContentImage";

import { FEEDBACK_IMAGE_FOLDER, MAX_IMAGES } from "./feedback";

export interface FeedbackImagePickerProps {
  /** Public URLs of the screenshots attached so far, in the order they were added. */
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}

/** Storage accepts anything the bucket allows; these are what a phone camera roll produces. */
function extensionFor(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

/**
 * Attaches up to {@link MAX_IMAGES} screenshots to a report. Files upload to the
 * public `content` bucket as soon as they're picked (folder `feedback/`), so by
 * the time the report is submitted it carries plain URLs — no multipart form,
 * and a slow upload never blocks typing.
 */
export default function FeedbackImagePicker({
  value,
  onChange,
  disabled = false,
}: FeedbackImagePickerProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = MAX_IMAGES - value.length;

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-picking the same file later
    if (files.length === 0) return;

    setError(null);
    setUploading(true);
    try {
      const picked = files.slice(0, remaining);
      const urls = await Promise.all(
        picked.map((file) =>
          uploadContentImage(file, FEEDBACK_IMAGE_FOLDER, extensionFor(file.type))
        )
      );
      onChange([...value, ...urls]);
      if (files.length > picked.length) {
        setError(`Only ${MAX_IMAGES} images per report — the extra ones were skipped.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">
        Screenshots <span className="text-white/30">(optional, up to {MAX_IMAGES})</span>
      </span>

      <div className="flex flex-wrap gap-2">
        {value.map((url, index) => (
          <div
            key={url}
            className="relative h-20 w-20 overflow-hidden rounded-xl border border-white/15 bg-white/5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Screenshot ${index + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((item) => item !== url))}
              disabled={disabled}
              aria-label={`Remove screenshot ${index + 1}`}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white/80 transition-colors hover:bg-black hover:text-white disabled:opacity-50"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M2 2l12 12M14 2L2 14"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/25 text-white/50 transition-colors hover:border-cyan hover:text-cyan disabled:opacity-50"
          >
            {uploading ? (
              <span className="text-[11px] font-bold">Uploading…</span>
            ) : (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="9" cy="11" r="2" />
                  <path d="M21 16l-5-5-6 6" />
                </svg>
                <span className="text-[11px] font-bold">Add</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />

      {error && (
        <p role="alert" className="text-sm font-semibold text-neon-pink">
          {error}
        </p>
      )}
    </div>
  );
}
