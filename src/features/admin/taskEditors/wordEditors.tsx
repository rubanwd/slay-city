"use client";

import { useState } from "react";

import {
  parseFillBlankContent,
  parseHangmanContent,
  parseSentenceBuilderContent,
  parseSpellingBeeContent,
  parseWordScrambleContent,
} from "@/features/mission/types";

import TaskImageField from "../TaskImageField";

import { StringListField, TextAreaField, TextField, useEmitContent, type TaskEditorProps } from "./fields";

export function WordScrambleEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseWordScrambleContent(initialContent ?? null);
  const [word, setWord] = useState(initial?.word ?? "");
  const [translation, setTranslation] = useState(initial?.translation ?? "");
  const [hint, setHint] = useState(initial?.hint ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");

  useEmitContent(onChange, {
    word,
    translation: translation || null,
    hint: hint || null,
    imageUrl: imageUrl || null,
  });

  return (
    <div className="flex flex-col gap-3">
      <TextField
        label="Word"
        value={word}
        onChange={setWord}
        placeholder="RAINBOW"
        uppercase
        hint="Its letters are shuffled for the student to unscramble. 3–8 letters works best."
      />
      <TextField label="Translation (optional)" value={translation} onChange={setTranslation} />
      <TextField label="Hint (optional)" value={hint} onChange={setHint} />
      <TaskImageField
        label="Image (optional)"
        value={imageUrl}
        onChange={setImageUrl}
        subject={word}
        context={translation}
      />
    </div>
  );
}

export function HangmanEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseHangmanContent(initialContent ?? null);
  const [word, setWord] = useState(initial?.word ?? "");
  const [hint, setHint] = useState(initial?.hint ?? "");
  const [translation, setTranslation] = useState(initial?.translation ?? "");

  useEmitContent(onChange, { word, hint: hint || null, translation: translation || null });

  return (
    <div className="flex flex-col gap-3">
      <TextField
        label="Word"
        value={word}
        onChange={setWord}
        placeholder="ELEPHANT"
        uppercase
        hint="The student guesses it letter by letter. Spaces are shown for multi-word answers."
      />
      <TextField label="Hint / category (optional)" value={hint} onChange={setHint} />
      <TextField label="Translation (optional)" value={translation} onChange={setTranslation} />
    </div>
  );
}

export function SpellingBeeEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseSpellingBeeContent(initialContent ?? null);
  const [word, setWord] = useState(initial?.word ?? "");
  const [audioUrl, setAudioUrl] = useState(initial?.audioUrl ?? "");
  const [translation, setTranslation] = useState(initial?.translation ?? "");
  const [prompt, setPrompt] = useState(initial?.prompt ?? "Listen and spell the word");

  useEmitContent(onChange, {
    word,
    audioUrl: audioUrl || null,
    translation: translation || null,
    prompt,
  });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Word" value={word} onChange={setWord} placeholder="banana" />
      <TextField
        label="Audio URL (optional)"
        value={audioUrl}
        onChange={setAudioUrl}
        hint="If empty, the device reads the word aloud with built-in speech."
      />
      <TextField label="Translation (optional)" value={translation} onChange={setTranslation} />
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
    </div>
  );
}

export function SentenceBuilderEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseSentenceBuilderContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "Put the words in order");
  const [words, setWords] = useState<string[]>(initial?.words ?? ["", "", ""]);
  const [translation, setTranslation] = useState(initial?.translation ?? "");

  useEmitContent(onChange, {
    prompt,
    words: words.map((w) => w.trim()).filter(Boolean),
    translation: translation || null,
  });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <StringListField
        label="Words (in the correct order)"
        values={words}
        onChange={setWords}
        placeholder="word"
        addLabel="+ Add word"
        min={2}
        hint="The student sees these shuffled and taps them back into this order."
      />
      <TextField label="Translation (optional)" value={translation} onChange={setTranslation} />
    </div>
  );
}

export function FillBlankEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseFillBlankContent(initialContent ?? null);
  const [sentence, setSentence] = useState(initial?.sentence ?? "");
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", ""]);
  const [translation, setTranslation] = useState(initial?.translation ?? "");

  useEmitContent(onChange, {
    sentence,
    answer,
    options: options.map((o) => o.trim()).filter(Boolean),
    translation: translation || null,
  });

  return (
    <div className="flex flex-col gap-3">
      <TextAreaField
        label="Sentence"
        value={sentence}
        onChange={setSentence}
        placeholder="The cat ___ on the mat."
        hint="Mark the gap with ___ (three underscores)."
      />
      <TextField label="Answer" value={answer} onChange={setAnswer} placeholder="sat" />
      <StringListField
        label="Options (optional — leave empty for typed answer)"
        values={options}
        onChange={setOptions}
        placeholder="choice"
        addLabel="+ Add option"
        min={0}
        hint="If you add options, include the answer among them for a tap-to-choose task."
      />
      <TextField label="Translation (optional)" value={translation} onChange={setTranslation} />
    </div>
  );
}
