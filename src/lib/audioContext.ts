/**
 * One shared Web Audio context for the whole app, reused by every
 * synthesised sound effect (snake hiss, mission start, map travel, reward
 * fanfare). A single context — instead of one per sound module — means
 * unlocking audio on the first tap anywhere unlocks every sound at once,
 * and the page never risks tripping a browser's per-page AudioContext limit.
 */

type AudioContextConstructor = new () => AudioContext;

let sharedContext: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  if (!Ctor) return null;

  sharedContext ??= new Ctor();
  return sharedContext;
}

/**
 * Returns the shared context resumed and ready to play, or `null` if Web
 * Audio is unavailable or the browser refused to resume it (e.g. called
 * outside a user gesture on a context that's still suspended).
 */
export async function resumeSharedAudioContext(): Promise<AudioContext | null> {
  const ctx = getSharedAudioContext();
  if (!ctx) return null;

  // A context created before the first gesture starts "suspended". On iOS,
  // backgrounding the PWA (switching to another app and back) instead knocks
  // it into a non-standard "interrupted" state that isn't part of the
  // AudioContextState type — so check for "not running" rather than name the
  // exact state, or that case would silently fall through and stay dead.
  if (ctx.state !== "running") {
    try {
      await ctx.resume();
    } catch {
      return null;
    }
  }

  return ctx;
}
