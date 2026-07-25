"use client";

import { useState } from "react";

import {
  parseMatchingContent,
  parseQuizContent,
  parseSnakeGameContent,
  parseVocabularyContent,
  type MatchingMode,
} from "@/features/mission/types";

import TaskImageField from "../TaskImageField";
import { INPUT_CLASS, LABEL_CLASS } from "../formStyles";

import {
  ADD_BTN,
  OptionsField,
  PairListField,
  REMOVE_BTN,
  SelectField,
  TextField,
  useEmitContent,
  type EditablePair,
  type TaskEditorProps,
} from "./fields";

export function VocabularyEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseVocabularyContent(initialContent ?? null);
  const [word, setWord] = useState(initial?.word ?? "");
  const [translation, setTranslation] = useState(initial?.translation ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [exampleSentence, setExampleSentence] = useState(initial?.exampleSentence ?? "");

  useEmitContent(onChange, {
    word,
    translation,
    imageUrl: imageUrl || null,
    exampleSentence: exampleSentence || null,
  });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Word" value={word} onChange={setWord} />
      <TextField label="Translation" value={translation} onChange={setTranslation} />
      <TaskImageField
        label="Image (optional)"
        value={imageUrl}
        onChange={setImageUrl}
        subject={word}
        context={translation}
      />
      <TextField label="Example Sentence" value={exampleSentence} onChange={setExampleSentence} />
    </div>
  );
}

export function MatchingEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseMatchingContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "Match each word to its picture");
  const [mode, setMode] = useState<MatchingMode>(initial?.mode ?? "word-to-image");
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
        onChange={(v) => setMode(v as MatchingMode)}
        options={[
          { value: "word-to-image", label: "Word to Image" },
          { value: "word-to-translation", label: "Word to Translation" },
        ]}
      />
      {mode === "word-to-image" ? (
        <MatchingImagePairs pairs={pairs} onChange={setPairs} />
      ) : (
        <PairListField label="Pairs" pairs={pairs} onChange={setPairs} matchPlaceholder="Translation" />
      )}
    </div>
  );
}

/** Word/image pair list for matching's word-to-image mode: each pair gets a
 *  word input plus a full upload-or-generate image control for its picture. */
function MatchingImagePairs({
  pairs,
  onChange,
}: {
  pairs: EditablePair[];
  onChange: (pairs: EditablePair[]) => void;
}) {
  const update = (i: number, patch: Partial<EditablePair>) =>
    onChange(pairs.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  return (
    <div className="flex flex-col gap-2">
      <span className={LABEL_CLASS}>Pairs</span>
      {pairs.map((pair, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-xl border border-white/10 p-3">
          <div className="flex items-center gap-2">
            <input
              value={pair.word}
              onChange={(e) => update(i, { word: e.target.value })}
              placeholder="Word (e.g. Bread)"
              className={INPUT_CLASS}
            />
            <button
              type="button"
              onClick={() => onChange(pairs.filter((_, idx) => idx !== i))}
              disabled={pairs.length <= 2}
              className={REMOVE_BTN}
            >
              ✕
            </button>
          </div>
          <TaskImageField
            label="Picture"
            value={pair.match}
            onChange={(url) => update(i, { match: url })}
            subject={pair.word}
            required
          />
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

export function QuizEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseQuizContent(initialContent ?? null);
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", ""]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);

  useEmitContent(onChange, {
    question,
    imageUrl: imageUrl || null,
    options: options.filter((o) => o.trim()),
    correctIndex,
  });

  const subject = options[correctIndex]?.trim() || question;

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Question" value={question} onChange={setQuestion} />
      <TaskImageField
        label="Image (optional)"
        value={imageUrl}
        onChange={setImageUrl}
        subject={subject}
      />
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

export function SnakeGameEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseSnakeGameContent(initialContent ?? null);
  const [word, setWord] = useState(initial?.word ?? "");
  const [translation, setTranslation] = useState(initial?.translation ?? "");
  const [prompt, setPrompt] = useState(initial?.prompt ?? "Collect the letters in order");

  useEmitContent(onChange, { word, translation: translation || null, prompt });

  return (
    <div className="flex flex-col gap-3">
      <TextField
        label="Word to collect"
        value={word}
        onChange={setWord}
        placeholder="CAT"
        uppercase
        hint="The student steers the snake over these letters in order. 3–8 letters works best."
      />
      <TextField label="Translation (optional)" value={translation} onChange={setTranslation} />
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
    </div>
  );
}
