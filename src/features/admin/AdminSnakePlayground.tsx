"use client";

import { useState } from "react";

import { SlayButton } from "@/components/ui";
import SnakeGameTask from "@/features/mission/SnakeGameTask";
import { parseSnakeGameContent, type SnakeGameContent } from "@/features/mission/types";

import AdminModal from "./AdminModal";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";

type Step = "closed" | "word" | "playing";

/**
 * A floating admin-only sandbox for trying the Snake task with any word, without
 * authoring a real mission task first. The word is round-tripped through
 * `parseSnakeGameContent` — the same parser the mission runner uses — so what an
 * admin sees here matches how an authored task would actually play.
 */
export default function AdminSnakePlayground() {
  const [step, setStep] = useState<Step>("closed");
  const [word, setWord] = useState("");
  const [content, setContent] = useState<SnakeGameContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setStep("closed");
    setContent(null);
    setError(null);
  };

  const start = () => {
    const parsed = parseSnakeGameContent({
      word,
      translation: null,
      prompt: "Collect the letters in order",
    });
    if (!parsed) {
      setError("Enter a word with at least one letter.");
      return;
    }
    setError(null);
    setContent(parsed);
    setStep("playing");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setStep("word")}
        className="fixed right-6 bottom-6 z-40 flex items-center gap-2 rounded-full border border-lime-green/50 bg-[#1a1a1a] px-4 py-3 text-xs font-black tracking-wide text-lime-green uppercase shadow-lg transition-colors hover:bg-lime-green/10 focus-visible:ring-2 focus-visible:ring-lime-green focus-visible:outline-none"
      >
        <span aria-hidden="true">🐍</span>
        Test Snake
      </button>

      <AdminModal open={step === "word"} onClose={close} title="Test Snake Game">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start();
          }}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Word to collect</span>
            <input
              value={word}
              onChange={(e) => setWord(e.target.value.toUpperCase())}
              placeholder="CAT"
              className={INPUT_CLASS}
            />
            <span className="text-xs text-white/40">
              The snake collects these letters in order. 3–8 letters works best.
            </span>
          </label>

          {error && (
            <p role="alert" className="text-sm font-semibold text-neon-pink">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <SlayButton type="submit" variant="green" size="md" className="flex-1">
              Play
            </SlayButton>
            <SlayButton type="button" variant="ghost" size="md" onClick={close}>
              Cancel
            </SlayButton>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={step === "playing" && content !== null}
        onClose={close}
        title={`Snake — ${content?.word ?? ""}`}
      >
        {content && (
          <div className="flex flex-col gap-3">
            {/* Remount per word so a new game always starts from a clean board. */}
            <SnakeGameTask
              key={content.word}
              content={content}
              onComplete={close}
              actionLabel="Done"
            />
            {/* Sits next to the D-pad, so quitting mid-game never means scrolling
                back up to the modal's ✕. Deliberately not part of SnakeGameTask:
                a child must not be able to walk out of a real mission task. */}
            <div className="flex gap-2">
              <SlayButton type="button" variant="ghost" size="md" className="flex-1" onClick={close}>
                Exit to admin
              </SlayButton>
              <SlayButton type="button" variant="pink" size="md" onClick={() => setStep("word")}>
                New word
              </SlayButton>
            </div>
          </div>
        )}
      </AdminModal>
    </>
  );
}
