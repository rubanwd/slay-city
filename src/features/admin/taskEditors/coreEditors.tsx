"use client";

import { useState } from "react";

import {
  parseMatchingContent,
  parseQuizContent,
  parseSnakeGameContent,
  parseVocabularyContent,
  type MatchingMode,
} from "@/features/mission/types";

import {
  OptionsField,
  PairListField,
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
      <TextField label="Image URL" value={imageUrl} onChange={setImageUrl} />
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
      <PairListField
        label="Pairs"
        pairs={pairs}
        onChange={setPairs}
        matchPlaceholder={mode === "word-to-image" ? "Image URL" : "Translation"}
      />
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

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Question" value={question} onChange={setQuestion} />
      <TextField label="Image URL" value={imageUrl} onChange={setImageUrl} />
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
        hint="The child steers the snake over these letters in order. 3–8 letters works best."
      />
      <TextField label="Translation (optional)" value={translation} onChange={setTranslation} />
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
    </div>
  );
}
