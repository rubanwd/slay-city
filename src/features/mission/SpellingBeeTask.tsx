"use client";

import { useCallback, useRef, useState } from "react";

import { SlayButton } from "@/components/ui";

import { normalizeAnswer } from "./taskUtils";
import type { SpellingBeeContent } from "./types";

export interface SpellingBeeTaskProps {
  content: SpellingBeeContent;
  onComplete: () => void;
  actionLabel?: string;
}

/**
 * The student hears the word — from an authored audio clip, or the device's speech
 * synthesis as a fallback — and types its spelling. The check is case- and
 * space-insensitive.
 */
export default function SpellingBeeTask({
  content,
  onComplete,
  actionLabel = "Next",
}: SpellingBeeTaskProps) {
  const { word, audioUrl, translation, prompt } = content;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);

  const isCorrect = normalizeAnswer(typed) === normalizeAnswer(word);

  const play = useCallback(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.currentTime = 0;
      void audioRef.current.play();
      return;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, [audioUrl, word]);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-center text-h3 font-semibold text-white">{prompt}</p>

      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" />}

      <button
        type="button"
        onClick={play}
        className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-cyan bg-cyan/10 text-4xl text-cyan transition-transform hover:scale-105 active:scale-95"
        aria-label="Play the word"
      >
        🔊
      </button>
      <p className="text-center text-small text-white/50">Tap to hear it again</p>

      <input
        value={typed}
        onChange={(e) => !checked && setTyped(e.target.value)}
        placeholder="Type what you hear"
        disabled={checked && isCorrect}
        autoCapitalize="none"
        autoCorrect="off"
        className={[
          "w-full rounded-xl border bg-white/10 px-4 py-3 text-center text-h3 font-bold text-white placeholder-white/40 caret-neon-pink focus:outline-none focus:ring-2",
          checked
            ? isCorrect
              ? "border-lime-green ring-lime-green/40"
              : "border-neon-pink ring-neon-pink/40"
            : "border-white/20 focus:border-neon-pink focus:ring-neon-pink/60",
        ].join(" ")}
      />

      {checked && (
        <p className={["text-center font-bold", isCorrect ? "text-lime-green" : "text-neon-pink"].join(" ")}>
          {isCorrect
            ? translation
              ? `Correct — ${translation}! 🎉`
              : "Correct! 🎉"
            : `Not quite — it's spelled "${word}".`}
        </p>
      )}

      {!checked && (
        <SlayButton
          variant="pink"
          size="lg"
          className="w-full"
          onClick={() => setChecked(true)}
          disabled={typed.trim() === ""}
        >
          Check
        </SlayButton>
      )}

      {checked && isCorrect && (
        <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete}>
          {actionLabel}
        </SlayButton>
      )}

      {checked && !isCorrect && (
        <SlayButton
          variant="pink"
          size="lg"
          className="w-full"
          onClick={() => {
            setChecked(false);
            setTyped("");
          }}
        >
          Try Again
        </SlayButton>
      )}
    </div>
  );
}
