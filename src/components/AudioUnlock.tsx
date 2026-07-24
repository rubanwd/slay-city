"use client";

import { useEffect } from "react";

import { resumeSharedAudioContext } from "@/lib/audioContext";

/**
 * Resumes the shared Web Audio context on the very first tap anywhere on the
 * page. Without this, the context only unlocks the moment some specific sound
 * first tries to play — usually fine, but a couple of sounds (the reward
 * fanfare) fire from an effect rather than directly inside a click handler,
 * so on stricter browsers it's safer to have grabbed an earlier, unambiguous
 * user gesture to unlock with.
 */
export function AudioUnlock() {
  useEffect(() => {
    const unlock = () => {
      void resumeSharedAudioContext();
    };

    document.addEventListener("pointerdown", unlock, { once: true, passive: true });
    document.addEventListener("touchend", unlock, { once: true, passive: true });

    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("touchend", unlock);
    };
  }, []);

  return null;
}
