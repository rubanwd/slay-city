"use client";

import { useState } from "react";

import {
  parseCompareSizeContent,
  parseCountingGameContent,
  parseDialogueChoiceContent,
  parseLetterFillContent,
  parseMathChallengeContent,
  parseNumberPatternContent,
  parsePictureRevealContent,
  parseReactionTapContent,
  parseRhymeMatchContent,
  parseSimonSequenceContent,
} from "@/features/mission/types";

import {
  NumberField,
  OptionsField,
  SelectField,
  StringListField,
  TextAreaField,
  TextField,
  useEmitContent,
  type TaskEditorProps,
} from "./fields";

export function CountingGameEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseCountingGameContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "How many do you see?");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🍎");
  const [count, setCount] = useState(initial?.count ?? 3);
  const [optionValues, setOptionValues] = useState<string[]>(
    initial?.options.map(String) ?? ["2", "3", "4", "5"]
  );

  useEmitContent(onChange, {
    prompt,
    emoji,
    count,
    options: optionValues.map((v) => Number(v)).filter((n) => Number.isFinite(n)),
  });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <TextField label="Emoji" value={emoji} onChange={setEmoji} hint="Repeated to build the counting grid." />
      <NumberField label="Correct count" value={count} onChange={setCount} min={1} max={30} />
      <StringListField
        label="Number choices"
        values={optionValues}
        onChange={setOptionValues}
        placeholder="4"
        addLabel="+ Add choice"
        min={2}
        hint="Include the correct count among these — it's added automatically if you forget."
      />
    </div>
  );
}

export function MathChallengeEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseMathChallengeContent(initialContent ?? null);
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", ""]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);

  useEmitContent(onChange, { question, options: options.filter((o) => o.trim()), correctIndex });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Question" value={question} onChange={setQuestion} placeholder="5 + 3 = ?" />
      <OptionsField
        label="Answers (select the correct one)"
        options={options}
        correctIndex={correctIndex}
        onOptionsChange={setOptions}
        onCorrectChange={setCorrectIndex}
      />
    </div>
  );
}

export function SimonSequenceEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseSimonSequenceContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "Watch, then repeat the pattern");
  const [colors, setColors] = useState<string[]>(initial?.colors ?? ["Red", "Blue", "Green", "Yellow"]);
  const [sequenceText, setSequenceText] = useState(
    initial ? initial.sequence.map((n) => n + 1).join(", ") : "1, 2, 1, 3"
  );

  useEmitContent(onChange, {
    prompt,
    colors: colors.map((c) => c.trim()).filter(Boolean),
    sequence: sequenceText
      .split(",")
      .map((s) => Number(s.trim()) - 1)
      .filter((n) => Number.isFinite(n) && n >= 0),
  });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <StringListField
        label="Tiles"
        values={colors}
        onChange={setColors}
        placeholder="Red"
        addLabel="+ Add tile"
        min={2}
        hint="Each tile's label — the on-screen color is assigned automatically."
      />
      <TextField
        label="Sequence"
        value={sequenceText}
        onChange={setSequenceText}
        placeholder="1, 2, 1, 3"
        hint="Comma-separated tile numbers (1-based) the child must repeat, in order."
      />
    </div>
  );
}

export function ReactionTapEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseReactionTapContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "Tap every correct word before time runs out!");
  const [correct, setCorrect] = useState<string[]>(initial?.correct ?? ["", ""]);
  const [distractors, setDistractors] = useState<string[]>(
    initial?.distractors.length ? initial.distractors : ["", ""]
  );
  const [roundSeconds, setRoundSeconds] = useState(initial?.roundSeconds ?? 15);

  useEmitContent(onChange, {
    prompt,
    correct: correct.map((w) => w.trim()).filter(Boolean),
    distractors: distractors.map((w) => w.trim()).filter(Boolean),
    roundSeconds,
  });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <NumberField label="Round length (seconds)" value={roundSeconds} onChange={setRoundSeconds} min={5} max={60} />
      <StringListField
        label="Correct words (all must be tapped)"
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

export function PictureRevealEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parsePictureRevealContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "What's in the picture?");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", ""]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);

  useEmitContent(onChange, { prompt, imageUrl, options: options.filter((o) => o.trim()), correctIndex });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <TextField label="Image URL" value={imageUrl} onChange={setImageUrl} hint="Starts blurred and sharpens as the child taps Reveal." />
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

export function RhymeMatchEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseRhymeMatchContent(initialContent ?? null);
  const [targetWord, setTargetWord] = useState(initial?.targetWord ?? "");
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", ""]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);

  useEmitContent(onChange, {
    targetWord,
    prompt: prompt || null,
    options: options.filter((o) => o.trim()),
    correctIndex,
  });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Target word" value={targetWord} onChange={setTargetWord} placeholder="cat" />
      <TextField
        label="Prompt (optional)"
        value={prompt}
        onChange={setPrompt}
        hint='Leave empty to auto-generate "Which word rhymes with …?".'
      />
      <OptionsField
        label="Options (select the one that rhymes)"
        options={options}
        correctIndex={correctIndex}
        onOptionsChange={setOptions}
        onCorrectChange={setCorrectIndex}
      />
    </div>
  );
}

export function NumberPatternEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseNumberPatternContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "What comes next?");
  const [sequence, setSequence] = useState<string[]>(initial?.sequence ?? ["2", "4", "?", "8"]);
  const [blankIndex, setBlankIndex] = useState(initial?.blankIndex ?? 2);
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", ""]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);

  useEmitContent(onChange, {
    prompt,
    sequence: sequence.map((s) => s.trim()).filter(Boolean),
    blankIndex,
    options: options.filter((o) => o.trim()),
    correctIndex,
  });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <StringListField
        label="Sequence (in order)"
        values={sequence}
        onChange={setSequence}
        placeholder="6"
        addLabel="+ Add item"
        min={3}
        hint="The tile at the blank position is hidden — set its index below."
      />
      <NumberField
        label="Blank position (0 = first item)"
        value={blankIndex}
        onChange={setBlankIndex}
        min={0}
        max={Math.max(0, sequence.length - 1)}
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

export function CompareSizeEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseCompareSizeContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "Tap the bigger one");
  const [optionA, setOptionA] = useState(initial?.optionA ?? "");
  const [optionB, setOptionB] = useState(initial?.optionB ?? "");
  const [imageUrlA, setImageUrlA] = useState(initial?.imageUrlA ?? "");
  const [imageUrlB, setImageUrlB] = useState(initial?.imageUrlB ?? "");
  const [correctOption, setCorrectOption] = useState<"a" | "b">(initial?.correctOption ?? "a");

  useEmitContent(onChange, {
    prompt,
    optionA,
    optionB,
    imageUrlA: imageUrlA || null,
    imageUrlB: imageUrlB || null,
    correctOption,
  });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <TextField label="Option A" value={optionA} onChange={setOptionA} placeholder="Elephant" />
      <TextField label="Option A image URL (optional)" value={imageUrlA} onChange={setImageUrlA} />
      <TextField label="Option B" value={optionB} onChange={setOptionB} placeholder="Mouse" />
      <TextField label="Option B image URL (optional)" value={imageUrlB} onChange={setImageUrlB} />
      <SelectField
        label="Correct option"
        value={correctOption}
        onChange={(v) => setCorrectOption(v as "a" | "b")}
        options={[
          { value: "a", label: "Option A" },
          { value: "b", label: "Option B" },
        ]}
      />
    </div>
  );
}

export function LetterFillEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseLetterFillContent(initialContent ?? null);
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
        placeholder="BANANA"
        uppercase
        hint="Every other letter is blanked out for the child to fill in. 3+ letters."
      />
      <TextField label="Hint (optional)" value={hint} onChange={setHint} />
      <TextField label="Translation (optional)" value={translation} onChange={setTranslation} />
    </div>
  );
}

export function DialogueChoiceEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseDialogueChoiceContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [speaker, setSpeaker] = useState(initial?.speaker ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", ""]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);
  const [translation, setTranslation] = useState(initial?.translation ?? "");

  useEmitContent(onChange, {
    prompt,
    speaker: speaker || null,
    options: options.filter((o) => o.trim()),
    correctIndex,
    translation: translation || null,
  });

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Speaker (optional)" value={speaker} onChange={setSpeaker} placeholder="Friend" />
      <TextAreaField label="Line" value={prompt} onChange={setPrompt} placeholder="How are you?" />
      <OptionsField
        label="Replies (select the best one)"
        options={options}
        correctIndex={correctIndex}
        onOptionsChange={setOptions}
        onCorrectChange={setCorrectIndex}
      />
      <TextField label="Translation (optional)" value={translation} onChange={setTranslation} />
    </div>
  );
}
