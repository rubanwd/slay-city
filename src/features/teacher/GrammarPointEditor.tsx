"use client";

import { INPUT_CLASS } from "@/features/admin/formStyles";

/** One editable grammar point in the teacher's draft. */
export interface DraftGrammarPoint {
  key: string;
  title: string;
  explanation: string;
  example: string;
}

export interface GrammarPointEditorProps {
  point: DraftGrammarPoint;
  index: number;
  onChange: (patch: Partial<DraftGrammarPoint>) => void;
  onRemove: () => void;
}

/**
 * A single grammar-point row in {@link GrammarManager}: title / explanation /
 * example fields. Purely presentational — all list mutation and persistence
 * lives in the parent (mirrors {@link VocabWordEditor} without the image).
 */
export default function GrammarPointEditor({
  point,
  index,
  onChange,
  onRemove,
}: GrammarPointEditorProps) {
  return (
    <li className="flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-[#1a1a1a] p-3">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-white/30">#{index + 1}</span>
        <input
          value={point.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="rule title (e.g. Present Simple: he/she/it + s)"
          className={`${INPUT_CLASS} !py-2 text-small`}
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove grammar point"
          className="shrink-0 rounded-md px-2 py-1 text-neon-pink hover:bg-white/5"
        >
          ✕
        </button>
      </div>
      <textarea
        value={point.explanation}
        onChange={(e) => onChange({ explanation: e.target.value })}
        placeholder="short, kid-friendly explanation"
        rows={2}
        className={`${INPUT_CLASS} !py-2 text-small`}
      />
      <input
        value={point.example}
        onChange={(e) => onChange({ example: e.target.value })}
        placeholder="example sentence"
        className={`${INPUT_CLASS} !py-2 text-small`}
      />
    </li>
  );
}
