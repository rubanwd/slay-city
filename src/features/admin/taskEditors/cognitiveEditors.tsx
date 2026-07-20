"use client";

import { useState } from "react";

import {
  parseAnalogyContent,
  parseAntonymMatchContent,
  parseCauseEffectContent,
  parseClockReadingContent,
  parseColorMixingContent,
  parseDigitSpanContent,
  parseEmotionMatchContent,
  parseShapeMatchContent,
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

export function ShapeMatchEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseShapeMatchContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "Tap the shape that matches");
  const [targetShape, setTargetShape] = useState(initial?.targetShape ?? "★");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["★", "●", "■"]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);

  useEmitContent(onChange, { prompt, targetShape, options: options.filter((o) => o.trim()), correctIndex });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <TextField label="Target shape" value={targetShape} onChange={setTargetShape} placeholder="★" hint="An emoji or symbol shown large." />
      <OptionsField
        label="Shape choices (select the match)"
        options={options}
        correctIndex={correctIndex}
        onOptionsChange={setOptions}
        onCorrectChange={setCorrectIndex}
        min={2}
      />
    </div>
  );
}

export function ColorMixingEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseColorMixingContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "What color do these make together?");
  const [colorA, setColorA] = useState(initial?.colorA ?? "Red");
  const [hexA, setHexA] = useState(initial?.hexA ?? "#FF3B3B");
  const [colorB, setColorB] = useState(initial?.colorB ?? "Blue");
  const [hexB, setHexB] = useState(initial?.hexB ?? "#3B82F6");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["Purple", "Green", "Orange"]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);

  useEmitContent(onChange, {
    prompt,
    colorA,
    hexA,
    colorB,
    hexB,
    options: options.filter((o) => o.trim()),
    correctIndex,
  });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Color A name" value={colorA} onChange={setColorA} placeholder="Red" />
        <TextField label="Color A swatch (hex)" value={hexA} onChange={setHexA} placeholder="#FF3B3B" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Color B name" value={colorB} onChange={setColorB} placeholder="Blue" />
        <TextField label="Color B swatch (hex)" value={hexB} onChange={setHexB} placeholder="#3B82F6" />
      </div>
      <OptionsField
        label="Resulting color choices"
        options={options}
        correctIndex={correctIndex}
        onOptionsChange={setOptions}
        onCorrectChange={setCorrectIndex}
      />
    </div>
  );
}

export function DigitSpanEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseDigitSpanContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "Watch the numbers…");
  const [digitsText, setDigitsText] = useState(initial ? initial.digits.join(", ") : "4, 7, 2, 9");

  useEmitContent(onChange, {
    prompt,
    digits: digitsText
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n >= 0 && n <= 9),
  });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <TextField
        label="Digits (in order)"
        value={digitsText}
        onChange={setDigitsText}
        placeholder="4, 7, 2, 9"
        hint="Comma-separated single digits (0–9) the child must recall in order. 3–6 works best."
      />
    </div>
  );
}

export function EmotionMatchEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseEmotionMatchContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "How does this feel?");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "😄");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["Happy", "Sad", "Angry"]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);

  useEmitContent(onChange, { prompt, emoji, options: options.filter((o) => o.trim()), correctIndex });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <TextField label="Face emoji" value={emoji} onChange={setEmoji} placeholder="😄" />
      <OptionsField
        label="Emotion words (select the correct one)"
        options={options}
        correctIndex={correctIndex}
        onOptionsChange={setOptions}
        onCorrectChange={setCorrectIndex}
      />
    </div>
  );
}

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
