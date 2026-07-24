/**
 * Mission-flow sound effects, synthesised at play time with the Web Audio
 * API — same approach as the snake hiss (./hiss.ts): no audio asset to ship
 * or fetch, so a tap never waits on a slow Storage response the first time
 * it's heard.
 */

import { fillWithNoise } from "./hiss";

type AudioContextConstructor = new () => AudioContext;

/** One shared context for the whole session — see hiss.ts for why. */
let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  if (!Ctor) return null;

  sharedContext ??= new Ctor();
  return sharedContext;
}

/** A context created before the first gesture starts suspended. */
async function resumeIfSuspended(ctx: AudioContext): Promise<boolean> {
  if (ctx.state !== "suspended") return true;
  try {
    await ctx.resume();
    return true;
  } catch {
    return false;
  }
}

interface ToneOptions {
  type?: OscillatorType;
  peakGain?: number;
  /** Optional pitch glide target — the oscillator slides from `frequency` to this. */
  glideTo?: number;
}

/** Plays a single tone with a quick-attack, exponential-decay envelope. */
function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  { type = "sine", peakGain = 0.25, glideTo }: ToneOptions = {}
): void {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  if (glideTo) {
    osc.frequency.exponentialRampToValueAtTime(glideTo, startTime + duration);
  }

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + Math.min(0.02, duration * 0.2));
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}

// ---------------------------------------------------------------------------
// Mission start: a rising two-note "let's go" blip.
// ---------------------------------------------------------------------------

/** Notes of the mission-start blip, low to high (C5 → G5). */
export const MISSION_START_NOTES = [523.25, 783.99];
export const MISSION_START_NOTE_DURATION_S = 0.16;
/** Notes overlap slightly rather than queuing end-to-end, so the blip feels snappy. */
export const MISSION_START_NOTE_STAGGER_S = MISSION_START_NOTE_DURATION_S * 0.8;

/** Plays when the player taps Start on a location's mission. */
export async function playMissionStartSfx(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (!(await resumeIfSuspended(ctx))) return;

  const now = ctx.currentTime;
  MISSION_START_NOTES.forEach((freq, i) => {
    playTone(ctx, freq, now + i * MISSION_START_NOTE_STAGGER_S, MISSION_START_NOTE_DURATION_S, {
      type: "triangle",
      peakGain: 0.3,
    });
  });
}

// ---------------------------------------------------------------------------
// Map travel: a soft pitch-down "whoosh" as the mascot glides to a new stop.
// ---------------------------------------------------------------------------

export const MAP_TRAVEL_DURATION_S = 0.32;
const MAP_TRAVEL_START_FREQUENCY = 2200;
const MAP_TRAVEL_END_FREQUENCY = 500;
const MAP_TRAVEL_PEAK_GAIN = 0.22;

/** Plays when the mascot is sent walking to a different map location. */
export async function playMapTravelSfx(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (!(await resumeIfSuspended(ctx))) return;

  const now = ctx.currentTime;
  const duration = MAP_TRAVEL_DURATION_S;

  const frames = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  fillWithNoise(buffer.getChannelData(0));

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // Sweeping the bandpass down turns flat noise into a "whoosh" with direction.
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.Q.value = 0.9;
  bandpass.frequency.setValueAtTime(MAP_TRAVEL_START_FREQUENCY, now);
  bandpass.frequency.exponentialRampToValueAtTime(MAP_TRAVEL_END_FREQUENCY, now + duration);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(MAP_TRAVEL_PEAK_GAIN, now + duration * 0.15);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(bandpass).connect(gain).connect(ctx.destination);
  source.onended = () => {
    source.disconnect();
    bandpass.disconnect();
    gain.disconnect();
  };

  source.start(now);
  source.stop(now + duration);
}

// ---------------------------------------------------------------------------
// Reward fanfare: an ascending "ta-da" arpeggio with a sparkly tail.
// ---------------------------------------------------------------------------

/** Notes of the reward fanfare, low to high (C5 E5 G5 C6). */
export const REWARD_FANFARE_NOTES = [523.25, 659.25, 783.99, 1046.5];
export const REWARD_FANFARE_NOTE_GAP_S = 0.11;
export const REWARD_FANFARE_NOTE_DURATION_S = 0.4;
/** The shimmer layered on top of each note sits a fifth above it, much quieter. */
const REWARD_FANFARE_SHIMMER_RATIO = 1.5;
const REWARD_FANFARE_SHIMMER_GAIN = 0.08;

/** Plays once when the Rewards screen for a completed mission appears. */
export async function playRewardFanfareSfx(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (!(await resumeIfSuspended(ctx))) return;

  const now = ctx.currentTime;
  REWARD_FANFARE_NOTES.forEach((freq, i) => {
    const startTime = now + i * REWARD_FANFARE_NOTE_GAP_S;
    playTone(ctx, freq, startTime, REWARD_FANFARE_NOTE_DURATION_S, {
      type: "triangle",
      peakGain: 0.28,
    });
    playTone(
      ctx,
      freq * REWARD_FANFARE_SHIMMER_RATIO,
      startTime,
      REWARD_FANFARE_NOTE_DURATION_S * 0.7,
      { type: "sine", peakGain: REWARD_FANFARE_SHIMMER_GAIN }
    );
  });
}
