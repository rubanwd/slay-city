"use client";

import { useState } from "react";

import { parseFlashcardsContent, parseStorySequencingContent } from "@/features/mission/types";

import TaskImageField from "../TaskImageField";
import { INPUT_CLASS, LABEL_CLASS } from "../formStyles";
import { ADD_BTN, REMOVE_BTN, TextField, useEmitContent, type TaskEditorProps } from "./fields";

export function FlashcardsEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseFlashcardsContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "Flip through the cards");
  const [cards, setCards] = useState(
    initial?.cards.map((c) => ({ front: c.front, back: c.back, imageUrl: c.imageUrl ?? "" })) ?? [
      { front: "", back: "", imageUrl: "" },
    ]
  );

  useEmitContent(onChange, {
    prompt,
    cards: cards
      .filter((c) => c.front.trim() && c.back.trim())
      .map((c, i) => ({ id: String(i + 1), front: c.front, back: c.back, imageUrl: c.imageUrl || null })),
  });

  const update = (i: number, patch: Partial<(typeof cards)[number]>) =>
    setCards((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <div className="flex flex-col gap-2">
        <span className={LABEL_CLASS}>Cards</span>
        <span className="text-xs text-white/40">Front is the prompt; back is revealed on flip.</span>
        {cards.map((card, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-white/10 p-3">
            <div className="flex items-center gap-2">
              <input
                value={card.front}
                onChange={(e) => update(i, { front: e.target.value })}
                placeholder="Front (e.g. dog)"
                className={INPUT_CLASS}
              />
              <button
                type="button"
                onClick={() => setCards((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={cards.length <= 1}
                className={REMOVE_BTN}
              >
                ✕
              </button>
            </div>
            <input
              value={card.back}
              onChange={(e) => update(i, { back: e.target.value })}
              placeholder="Back (e.g. собака)"
              className={INPUT_CLASS}
            />
            <TaskImageField
              label="Image (optional)"
              value={card.imageUrl}
              onChange={(url) => update(i, { imageUrl: url })}
              subject={card.front}
              context={card.back}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setCards((prev) => [...prev, { front: "", back: "", imageUrl: "" }])}
          className={ADD_BTN}
        >
          + Add card
        </button>
      </div>
    </div>
  );
}

export function StorySequencingEditor({ initialContent, onChange }: TaskEditorProps) {
  const initial = parseStorySequencingContent(initialContent ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "Put the story in order");
  const [steps, setSteps] = useState(
    initial?.steps.map((s) => ({ text: s.text, imageUrl: s.imageUrl ?? "" })) ?? [
      { text: "", imageUrl: "" },
      { text: "", imageUrl: "" },
    ]
  );

  useEmitContent(onChange, {
    prompt,
    steps: steps
      .filter((s) => s.text.trim())
      .map((s, i) => ({ id: String(i + 1), text: s.text, imageUrl: s.imageUrl || null })),
  });

  const update = (i: number, patch: Partial<(typeof steps)[number]>) =>
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Prompt" value={prompt} onChange={setPrompt} />
      <div className="flex flex-col gap-2">
        <span className={LABEL_CLASS}>Steps (in the correct order)</span>
        <span className="text-xs text-white/40">
          The child sees these shuffled and drags them back into this order.
        </span>
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-white/10 p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-white/70">
                {i + 1}
              </span>
              <input
                value={step.text}
                onChange={(e) => update(i, { text: e.target.value })}
                placeholder="First, she woke up."
                className={INPUT_CLASS}
              />
              <button
                type="button"
                onClick={() => setSteps((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={steps.length <= 2}
                className={REMOVE_BTN}
              >
                ✕
              </button>
            </div>
            <input
              value={step.imageUrl}
              onChange={(e) => update(i, { imageUrl: e.target.value })}
              placeholder="Image URL (optional)"
              className={INPUT_CLASS}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSteps((prev) => [...prev, { text: "", imageUrl: "" }])}
          className={ADD_BTN}
        >
          + Add step
        </button>
      </div>
    </div>
  );
}
