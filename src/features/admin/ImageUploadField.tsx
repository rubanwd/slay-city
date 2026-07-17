"use client";

import { useRef, useState, type ChangeEvent } from "react";

import { uploadContentImage, type ContentImageFolder } from "./uploadContentImage";
import { LABEL_CLASS } from "./formStyles";

export interface ImageUploadFieldProps {
  /** Name of the hidden input carrying the uploaded public URL. Omit when a parent owns the input. */
  name?: string;
  label?: string;
  /** Existing URL when editing (uncontrolled mode). */
  defaultValue?: string | null;
  /** Storage folder the image is uploaded into. */
  folder: ContentImageFolder;
  /** Controlled mode: the parent owns the URL. Pass `onChange` too. */
  value?: string;
  onChange?: (url: string) => void;
}

/** Plain image upload (no crop) with a circular preview — used for location icons. */
export default function ImageUploadField({
  name,
  label,
  defaultValue,
  folder,
  value,
  onChange,
}: ImageUploadFieldProps) {
  const [internalUrl, setInternalUrl] = useState<string>(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const controlled = value !== undefined;
  const url = controlled ? value : internalUrl;
  const setUrl = controlled ? (onChange ?? (() => {})) : setInternalUrl;

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const publicUrl = await uploadContentImage(file, folder, ext);
      setUrl(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className={LABEL_CLASS}>{label}</span>}
      {name && <input type="hidden" name={name} value={url} />}

      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/5">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl text-white/30" aria-hidden="true">
              📍
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : url ? "Replace" : "Upload"}
          </button>
          {url && !uploading && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="text-left text-xs font-semibold text-neon-pink hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm font-semibold text-neon-pink">
          {error}
        </p>
      )}
    </div>
  );
}
