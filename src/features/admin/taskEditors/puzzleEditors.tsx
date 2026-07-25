"use client";

import { useState } from "react";

import {
  parseCategorySortContent,
  parseCrosswordContent,
  parseMemoryCardsContent,
  parseWordSearchContent,
  type CrosswordDirection,
  type MemoryMode,
} from "@/features/mission/types";

import { INPUT_CLASS, LABEL_CLASS } from "../formStyles";
import {
  ADD_BTN,
  NumberField,
  PairListField,
  REMOVE_BTN,
  SelectField,
  StringListField,
  TextField,
  useEmitContent,
  type EditablePair,
  type TaskEditorProps,
} from "./fields";

export function WordSearchEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseWordSearchContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "Find the hidden words");
  const [words, setWords] = useState<string[]>(initial?.words ?? ["", ""]);
  const [size, setSize] = useState(initial?.size ?? 8);

  useEmitContent(onChange, {
    prompt,
    words: words.map((w) => w.replace(/\s+/g, "").toUpperCase()).filter((w) => w.length >= 2),
    size,
  });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <StringListField
        label="Words to hide"
        values={words}
        onChange={setWords}
        placeholder="CAT"
        addLabel="+ Add word"
        min={1}
        uppercase
        hint="Words are placed across, down, and diagonally. Keep them shorter than the grid size."
      />
      <NumberField
        label="Grid size"
        value={size}
        onChange={setSize}
        min={5}
        max={14}
        hint="Number of cells per side (5–14). Must be at least as long as your longest word."
      />
    </div>
  );
}

export function CrosswordEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseCrosswordContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "Solve the crossword");
  const [entries, setEntries] = useState(
    initial?.entries ?? [
      { answer: "", clue: "", row: 0, col: 0, direction: "across" as CrosswordDirection },
    ]
  );

  useEmitContent(onChange, {
    prompt,
    entries: entries
      .filter((e) => e.answer.trim() && e.clue.trim())
      .map((e) => ({
        answer: e.answer.replace(/\s+/g, "").toUpperCase(),
        clue: e.clue,
        row: e.row,
        col: e.col,
        direction: e.direction,
      })),
  });

  const update = (i: number, patch: Partial<(typeof entries)[number]>) =>
    setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <div className="flex flex-col gap-3">
        <span className={LABEL_CLASS}>Entries</span>
        <span className="text-xs text-white/40">
          Row/column are 0-based grid coordinates of the first letter. Crossing words should share a
          cell with the same letter.
        </span>
        {entries.map((entry, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-white/10 p-3">
            <div className="flex items-center gap-2">
              <input
                value={entry.answer}
                onChange={(e) => update(i, { answer: e.target.value.toUpperCase() })}
                placeholder="ANSWER"
                className={INPUT_CLASS}
              />
              <button
                type="button"
                onClick={() => setEntries((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={entries.length <= 1}
                className={REMOVE_BTN}
              >
                ✕
              </button>
            </div>
            <input
              value={entry.clue}
              onChange={(e) => update(i, { clue: e.target.value })}
              placeholder="Clue"
              className={INPUT_CLASS}
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                min={0}
                value={entry.row}
                onChange={(e) => update(i, { row: Number(e.target.value) })}
                placeholder="Row"
                aria-label="Row"
                className={INPUT_CLASS}
              />
              <input
                type="number"
                min={0}
                value={entry.col}
                onChange={(e) => update(i, { col: Number(e.target.value) })}
                placeholder="Col"
                aria-label="Column"
                className={INPUT_CLASS}
              />
              <select
                value={entry.direction}
                onChange={(e) => update(i, { direction: e.target.value as CrosswordDirection })}
                aria-label="Direction"
                className={`${INPUT_CLASS} [&>option]:bg-[#1a1a1a] [&>option]:text-white`}
              >
                <option value="across">Across</option>
                <option value="down">Down</option>
              </select>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setEntries((prev) => [...prev, { answer: "", clue: "", row: 0, col: 0, direction: "across" }])
          }
          className={ADD_BTN}
        >
          + Add entry
        </button>
      </div>
    </div>
  );
}

export function MemoryCardsEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseMemoryCardsContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "Find the pairs");
  const [mode, setMode] = useState<MemoryMode>(initial?.mode ?? "word-to-translation");
  const [pairs, setPairs] = useState<EditablePair[]>(
    initial?.pairs.map((p) => ({ word: p.word, match: p.match })) ?? [
      { word: "", match: "" },
      { word: "", match: "" },
    ]
  );

  useEmitContent(onChange, {
    prompt,
    mode,
    pairs: pairs
      .filter((p) => p.word.trim() && p.match.trim())
      .map((p, i) => ({ id: String(i + 1), word: p.word, match: p.match })),
  });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <SelectField
        label="Mode"
        value={mode}
        onChange={(v) => setMode(v as MemoryMode)}
        options={[
          { value: "word-to-translation", label: "Word to Translation" },
          { value: "word-to-image", label: "Word to Image" },
        ]}
      />
      <PairListField
        label="Pairs"
        pairs={pairs}
        onChange={setPairs}
        matchPlaceholder={mode === "word-to-image" ? "Image URL" : "Translation"}
        hint="Each pair becomes two cards the student flips to match. 2–6 pairs works best."
      />
    </div>
  );
}

export function CategorySortEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseCategorySortContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "Sort into the right group");
  const [categories, setCategories] = useState<string[]>(initial?.categories ?? ["", ""]);
  const [items, setItems] = useState(
    initial?.items ?? [
      { text: "", categoryIndex: 0 },
      { text: "", categoryIndex: 0 },
    ]
  );

  const cleanCategories = categories.map((c) => c.trim());

  useEmitContent(onChange, {
    prompt,
    categories: cleanCategories.filter(Boolean),
    items: items
      .filter((it) => it.text.trim() && it.categoryIndex < cleanCategories.filter(Boolean).length)
      .map((it) => ({ text: it.text, categoryIndex: it.categoryIndex })),
  });

  const update = (i: number, patch: Partial<(typeof items)[number]>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <StringListField
        label="Categories"
        values={categories}
        onChange={setCategories}
        placeholder="Fruits"
        addLabel="+ Add category"
        min={2}
      />
      <div className="flex flex-col gap-2">
        <span className={LABEL_CLASS}>Items</span>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={item.text}
              onChange={(e) => update(i, { text: e.target.value })}
              placeholder="Apple"
              className={INPUT_CLASS}
            />
            <select
              value={item.categoryIndex}
              onChange={(e) => update(i, { categoryIndex: Number(e.target.value) })}
              aria-label="Category"
              className={`${INPUT_CLASS} max-w-[9rem] [&>option]:bg-[#1a1a1a] [&>option]:text-white`}
            >
              {cleanCategories.map((c, idx) => (
                <option key={idx} value={idx}>
                  {c || `Category ${idx + 1}`}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
              disabled={items.length <= 1}
              className={REMOVE_BTN}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, { text: "", categoryIndex: 0 }])}
          className={ADD_BTN}
        >
          + Add item
        </button>
      </div>
    </div>
  );
}
