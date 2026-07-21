"use client";

/* eslint-disable @next/next/no-img-element -- teacher-authored word images (data URLs + storage URLs) */

import { useRef } from "react";

import { INPUT_CLASS } from "@/features/admin/formStyles";

/** One editable vocabulary word in the teacher's draft. */
export interface DraftWord {
  key: string;
  word: string;
  transcription: string;
  translation: string;
  /** Persisted/public image URL (already in storage). */
  imageUrl: string | null;
  /** AI-generated preview not yet uploaded — takes precedence for display. */
  imageDataUrl: string | null;
  /** Hint fed to the image model for this word. */
  imagePrompt: string | null;
}

export interface VocabWordEditorProps {
  word: DraftWord;
  index: number;
  imageBusy: boolean;
  onChange: (patch: Partial<DraftWord>) => void;
  onRemove: () => void;
  onGenerateImage: () => void;
  onUploadImage: (file: File) => void;
}

/**
 * A single word row in {@link VocabularyManager}: word / transcription /
 * translation fields plus its flashcard image (AI-generate or upload). Purely
 * presentational — all list mutation and persistence lives in the parent.
 */
export default function VocabWordEditor({
  word,
  index,
  imageBusy,
  onChange,
  onRemove,
  onGenerateImage,
  onUploadImage,
}: VocabWordEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const preview = word.imageDataUrl ?? word.imageUrl;

  return (
    <li className="flex gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] p-3">
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-white/5">
          {imageBusy ? (
            <span className="animate-pulse text-[10px] text-white/50">…</span>
          ) : preview ? (
            <img src={preview} alt={word.word} className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl">🖼️</span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onGenerateImage}
            disabled={imageBusy || !word.word.trim()}
            className="rounded-md bg-purple/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white disabled:opacity-40"
          >
            AI
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={imageBusy}
            className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white disabled:opacity-40"
          >
            Upload
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadImage(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-white/30">#{index + 1}</span>
          <input
            value={word.word}
            onChange={(e) => onChange({ word: e.target.value })}
            placeholder="word (English)"
            className={`${INPUT_CLASS} !py-2 text-small`}
          />
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove word"
            className="shrink-0 rounded-md px-2 py-1 text-neon-pink hover:bg-white/5"
          >
            ✕
          </button>
        </div>
        <input
          value={word.transcription}
          onChange={(e) => onChange({ transcription: e.target.value })}
          placeholder="/trænˈskrɪp.ʃən/"
          className={`${INPUT_CLASS} !py-2 text-small`}
        />
        <input
          value={word.translation}
          onChange={(e) => onChange({ translation: e.target.value })}
          placeholder="translation"
          className={`${INPUT_CLASS} !py-2 text-small`}
        />
      </div>
    </li>
  );
}
