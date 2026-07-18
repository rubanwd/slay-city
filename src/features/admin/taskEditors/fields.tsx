"use client";

import { useEffect } from "react";

import type { Json } from "@/types/database";

import { INPUT_CLASS, LABEL_CLASS } from "../formStyles";

/** Contract every guided task-content editor implements. */
export interface TaskEditorProps {
  /** Existing content when editing a task of this same type. Omit for a new task. */
  initialContent?: Json;
  /** Called with the built content object whenever the guided fields change. */
  onChange: (content: Record<string, unknown>) => void;
}

/**
 * Emits the freshly built content to the parent whenever it changes. Keyed on a
 * JSON snapshot so a new-but-equal object doesn't fire, and so the effect runs
 * once on mount to seed the parent with the initial guided values.
 */
export function useEmitContent(
  onChange: (content: Record<string, unknown>) => void,
  content: Record<string, unknown>
): void {
  // `content` is rebuilt every render; the string snapshot is the real dep.
  const snapshot = JSON.stringify(content);
  useEffect(() => {
    onChange(JSON.parse(snapshot));
  }, [snapshot, onChange]);
}

const SELECT_CLASS = `${INPUT_CLASS} [&>option]:bg-[#1a1a1a] [&>option]:text-white`;

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={LABEL_CLASS}>{label}</span>
      {children}
      {hint && <span className="text-xs text-white/40">{hint}</span>}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  uppercase,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  uppercase?: boolean;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        value={value}
        onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
    </Field>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
}) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={INPUT_CLASS}
      />
    </Field>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className={INPUT_CLASS}
      />
    </Field>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASS}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

const REMOVE_BTN =
  "shrink-0 rounded-lg border border-white/20 px-2 py-2 text-xs text-white/60 hover:bg-white/10 disabled:opacity-30";
const ADD_BTN =
  "self-start text-xs font-bold uppercase tracking-wide text-lime-green hover:underline";

/** Editable list of plain strings, with add/remove and an enforced minimum. */
export function StringListField({
  label,
  values,
  onChange,
  placeholder,
  addLabel = "+ Add",
  min = 1,
  uppercase,
  hint,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  min?: number;
  uppercase?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className={LABEL_CLASS}>{label}</span>
      {hint && <span className="text-xs text-white/40">{hint}</span>}
      {values.map((value, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={value}
            onChange={(e) =>
              onChange(
                values.map((v, idx) =>
                  idx === i ? (uppercase ? e.target.value.toUpperCase() : e.target.value) : v
                )
              )
            }
            placeholder={placeholder}
            className={INPUT_CLASS}
          />
          <button
            type="button"
            onClick={() => onChange(values.filter((_, idx) => idx !== i))}
            disabled={values.length <= min}
            className={REMOVE_BTN}
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...values, ""])} className={ADD_BTN}>
        {addLabel}
      </button>
    </div>
  );
}

/**
 * A list of options with exactly one marked correct via a radio. Removing the
 * correct option resets the selection to the first remaining one.
 */
export function OptionsField({
  label,
  options,
  correctIndex,
  onOptionsChange,
  onCorrectChange,
  min = 2,
  hint,
}: {
  label: string;
  options: string[];
  correctIndex: number;
  onOptionsChange: (options: string[]) => void;
  onCorrectChange: (index: number) => void;
  min?: number;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className={LABEL_CLASS}>{label}</span>
      {hint && <span className="text-xs text-white/40">{hint}</span>}
      {options.map((option, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="radio"
            checked={correctIndex === i}
            onChange={() => onCorrectChange(i)}
            aria-label={`Mark option ${i + 1} correct`}
            className="h-4 w-4 shrink-0 accent-lime-green"
          />
          <input
            value={option}
            onChange={(e) => onOptionsChange(options.map((o, idx) => (idx === i ? e.target.value : o)))}
            placeholder={`Option ${i + 1}`}
            className={INPUT_CLASS}
          />
          <button
            type="button"
            onClick={() => {
              onOptionsChange(options.filter((_, idx) => idx !== i));
              onCorrectChange(i === correctIndex ? 0 : i < correctIndex ? correctIndex - 1 : correctIndex);
            }}
            disabled={options.length <= min}
            className={REMOVE_BTN}
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onOptionsChange([...options, ""])} className={ADD_BTN}>
        + Add option
      </button>
    </div>
  );
}

export interface EditablePair {
  word: string;
  match: string;
}

/** Editable list of word/match pairs, with add/remove and an enforced minimum. */
export function PairListField({
  label,
  pairs,
  onChange,
  wordPlaceholder = "Word",
  matchPlaceholder = "Match",
  min = 2,
  hint,
}: {
  label: string;
  pairs: EditablePair[];
  onChange: (pairs: EditablePair[]) => void;
  wordPlaceholder?: string;
  matchPlaceholder?: string;
  min?: number;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className={LABEL_CLASS}>{label}</span>
      {hint && <span className="text-xs text-white/40">{hint}</span>}
      {pairs.map((pair, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={pair.word}
            onChange={(e) => onChange(pairs.map((p, idx) => (idx === i ? { ...p, word: e.target.value } : p)))}
            placeholder={wordPlaceholder}
            className={INPUT_CLASS}
          />
          <input
            value={pair.match}
            onChange={(e) => onChange(pairs.map((p, idx) => (idx === i ? { ...p, match: e.target.value } : p)))}
            placeholder={matchPlaceholder}
            className={INPUT_CLASS}
          />
          <button
            type="button"
            onClick={() => onChange(pairs.filter((_, idx) => idx !== i))}
            disabled={pairs.length <= min}
            className={REMOVE_BTN}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...pairs, { word: "", match: "" }])}
        className={ADD_BTN}
      >
        + Add pair
      </button>
    </div>
  );
}

export { ADD_BTN, REMOVE_BTN };
