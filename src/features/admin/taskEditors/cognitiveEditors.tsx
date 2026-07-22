"use client";

import { useState } from "react";

import {
  parseAnalogyContent,
  parseAntonymMatchContent,
  parseCauseEffectContent,
  parseClockReadingContent,
  parseSizeOrderContent,
  parseSpotTheDifferenceContent,
} from "@/features/mission/types";

import {
  NumberField,
  OptionsField,
  StringListField,
  TextAreaField,
  TextField,
  useEmitContent,
  type TaskEditorProps,
} from "./fields";

export function CauseEffectEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseCauseEffectContent(initialContent ?? null);
  const [cause, setCause] = useState(initial?.cause ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", ""]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);

  useEmitContent(onChange, { cause, options: options.filter((o) => o.trim()), correctIndex });

  return (
    <div className="flex flex-col gap-3">
      <TextAreaField label="Cause" value={cause} onChange={setCause} placeholder="You touch a hot stove." />
      <OptionsField
        label="Effects (select the correct one)"
        options={options}
        correctIndex={correctIndex}
        onOptionsChange={setOptions}
        onCorrectChange={setCorrectIndex}
      />
    </div>
  );
}

export function AnalogyEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseAnalogyContent(initialContent ?? null);
  const [wordA, setWordA] = useState(initial?.wordA ?? "");
  const [wordB, setWordB] = useState(initial?.wordB ?? "");
  const [wordC, setWordC] = useState(initial?.wordC ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", ""]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);

  useEmitContent(onChange, { wordA, wordB, wordC, options: options.filter((o) => o.trim()), correctIndex });

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Word A" value={wordA} onChange={setWordA} placeholder="Bird" />
        <TextField label="Word B" value={wordB} onChange={setWordB} placeholder="Sky" />
      </div>
      <TextField label="Word C" value={wordC} onChange={setWordC} placeholder="Fish" hint='Shown as "A is to B as C is to ___?".' />
      <OptionsField
        label="Options (select the correct one)"
        options={options}
        correctIndex={correctIndex}
        onOptionsChange={setOptions}
        onCorrectChange={setCorrectIndex}
      />
    </div>
  );
}

export function AntonymMatchEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseAntonymMatchContent(initialContent ?? null);
  const [word, setWord] = useState(initial?.word ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", ""]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);

  useEmitContent(onChange, { word, options: options.filter((o) => o.trim()), correctIndex });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Word" value={word} onChange={setWord} placeholder="Hot" />
      <OptionsField
        label="Options (select the opposite)"
        options={options}
        correctIndex={correctIndex}
        onOptionsChange={setOptions}
        onCorrectChange={setCorrectIndex}
      />
    </div>
  );
}

export function SizeOrderEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseSizeOrderContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "Tap in order, smallest to largest");
  const [items, setItems] = useState<string[]>(initial?.items ?? ["", "", ""]);

  useEmitContent(onChange, { prompt, items: items.map((i) => i.trim()).filter(Boolean) });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <StringListField
        label="Items (in the correct order)"
        values={items}
        onChange={setItems}
        placeholder="Ant"
        addLabel="+ Add item"
        min={3}
        hint="The child sees these shuffled and taps them back into this order."
      />
    </div>
  );
}

export function SpotTheDifferenceEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseSpotTheDifferenceContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "Find the one that's different");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🍎");
  const [oddEmoji, setOddEmoji] = useState(initial?.oddEmoji ?? "🍊");
  const [gridSize, setGridSize] = useState(initial?.gridSize ?? 9);
  const [oddIndex, setOddIndex] = useState(initial?.oddIndex ?? 4);

  useEmitContent(onChange, { prompt, emoji, oddEmoji, gridSize, oddIndex });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Repeated emoji" value={emoji} onChange={setEmoji} placeholder="🍎" />
        <TextField label="Odd-one-out emoji" value={oddEmoji} onChange={setOddEmoji} placeholder="🍊" />
      </div>
      <NumberField label="Grid size (total cells)" value={gridSize} onChange={setGridSize} min={4} max={30} />
      <NumberField
        label="Odd cell position (0 = first cell)"
        value={oddIndex}
        onChange={setOddIndex}
        min={0}
        max={Math.max(0, gridSize - 1)}
      />
    </div>
  );
}

export function ClockReadingEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseClockReadingContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "What time is it?");
  const [hour, setHour] = useState(initial?.hour ?? 3);
  const [minute, setMinute] = useState(initial?.minute ?? 30);
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["3:00", "3:30", "4:00"]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 1);

  useEmitContent(onChange, { prompt, hour, minute, options: options.filter((o) => o.trim()), correctIndex });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Hour (1–12)" value={hour} onChange={setHour} min={1} max={12} />
        <NumberField label="Minute (0–59)" value={minute} onChange={setMinute} min={0} max={59} />
      </div>
      <OptionsField
        label="Time choices (select the correct one)"
        options={options}
        correctIndex={correctIndex}
        onOptionsChange={setOptions}
        onCorrectChange={setCorrectIndex}
      />
    </div>
  );
}
