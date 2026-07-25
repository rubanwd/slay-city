"use client";

import { useState } from "react";

import {
  parseBubblePopContent,
  parseEmojiDecodeContent,
  parseOddOneOutContent,
  parseTrueFalseContent,
} from "@/features/mission/types";

import TaskImageField from "../TaskImageField";

import {
  OptionsField,
  SelectField,
  StringListField,
  TextField,
  useEmitContent,
  type TaskEditorProps,
} from "./fields";

export function EmojiDecodeEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseEmojiDecodeContent(initialContent ?? null);
  const [emojis, setEmojis] = useState(initial?.emojis ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", ""]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);
  const [translation, setTranslation] = useState(initial?.translation ?? "");

  useEmitContent(onChange, {
    emojis,
    options: options.filter((o) => o.trim()),
    correctIndex,
    translation: translation || null,
  });

  return (
    <div className="flex flex-col gap-3">
      <TextField
        label="Emojis"
        value={emojis}
        onChange={setEmojis}
        placeholder="🌧️ + 🏹 = ?"
        hint="The emoji puzzle the student decodes into a word."
      />
      <OptionsField
        label="Options (select the correct word)"
        options={options}
        correctIndex={correctIndex}
        onOptionsChange={setOptions}
        onCorrectChange={setCorrectIndex}
      />
      <TextField label="Translation (optional)" value={translation} onChange={setTranslation} />
    </div>
  );
}

export function OddOneOutEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseOddOneOutContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "Which one doesn't belong?");
  const [words, setWords] = useState<string[]>(initial?.words ?? ["", "", "", ""]);
  const [oddIndex, setOddIndex] = useState(initial?.oddIndex ?? 0);

  useEmitContent(onChange, {
    prompt,
    words: words.filter((w) => w.trim()),
    oddIndex,
  });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <OptionsField
        label="Words (mark the odd one out)"
        options={words}
        correctIndex={oddIndex}
        onOptionsChange={setWords}
        onCorrectChange={setOddIndex}
        min={3}
      />
    </div>
  );
}

export function TrueFalseEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseTrueFalseContent(initialContent ?? null);
  const [statement, setStatement] = useState(initial?.statement ?? "");
  const [isTrue, setIsTrue] = useState(initial?.isTrue ?? true);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");

  useEmitContent(onChange, { statement, isTrue, imageUrl: imageUrl || null });

  return (
    <div className="flex flex-col gap-3">
      <TextField
        label="Statement"
        value={statement}
        onChange={setStatement}
        placeholder="A spider has six legs."
      />
      <SelectField
        label="Correct answer"
        value={isTrue ? "true" : "false"}
        onChange={(v) => setIsTrue(v === "true")}
        options={[
          { value: "true", label: "True" },
          { value: "false", label: "False" },
        ]}
      />
      <TaskImageField
        label="Image (optional)"
        value={imageUrl}
        onChange={setImageUrl}
        subject={statement}
      />
    </div>
  );
}

export function BubblePopEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseBubblePopContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "Pop the correct bubbles");
  const [correct, setCorrect] = useState<string[]>(initial?.correct ?? ["", ""]);
  const [distractors, setDistractors] = useState<string[]>(
    initial?.distractors.length ? initial.distractors : ["", ""]
  );

  useEmitContent(onChange, {
    prompt,
    correct: correct.map((w) => w.trim()).filter(Boolean),
    distractors: distractors.map((w) => w.trim()).filter(Boolean),
  });

  return (
    <div className="flex flex-col gap-3">
      <TextField
        label="Prompt"
        value={prompt}
        onChange={setPrompt}
        hint="Tell the student what to pop, e.g. 'Pop the animals'."
      />
      <StringListField
        label="Correct words (all must be popped)"
        values={correct}
        onChange={setCorrect}
        placeholder="cat"
        addLabel="+ Add correct word"
        min={1}
      />
      <StringListField
        label="Distractor words (avoid these)"
        values={distractors}
        onChange={setDistractors}
        placeholder="table"
        addLabel="+ Add distractor"
        min={0}
      />
    </div>
  );
}
